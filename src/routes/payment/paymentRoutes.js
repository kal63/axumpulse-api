'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { initializePayment, verifyTransaction } = require('../../utils/chapaService')
const { PaymentTransaction, SubscriptionPlan, UserSubscription, User, MedicalProfessional, UserProfile } = require('../../models')
const { requireAuth } = require('../../middleware/auth')
const { Op } = require('sequelize')
const { activateSubscription } = require('../../services/subscriptionService')

/**
 * Ensure a URL is absolute and has a protocol so that
 * external services like payment gateways accept it.
 *
 * - If value already has http/https, keep it.
 * - If it's localhost or 127.0.0.1, default to http (no SSL in dev).
 * - Otherwise default to https.
 */
function ensureAbsoluteUrl(url, fallback) {
    if (!url && fallback) return fallback
    if (!url) return ''

    let normalized = url.trim()

    // If it already has a protocol, just return it
    if (/^https?:\/\//i.test(normalized)) {
        return normalized
    }

    // Local dev hosts: use http and ensure port when omitted.
    // If caller passed "localhost" without a port, borrow fallback's port
    // (or default to 3000) so redirects don't become http://localhost/path.
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(normalized)) {
        const hasPort = /^(localhost|127\.0\.0\.1):\d+/i.test(normalized)
        if (!hasPort) {
            let fallbackPort = '3000'
            if (fallback) {
                const match = String(fallback).match(/^https?:\/\/[^/:]+:(\d+)/i)
                if (match?.[1]) fallbackPort = match[1]
            }
            normalized = `${normalized.replace(/\/$/, '')}:${fallbackPort}`
        }
        return `http://${normalized}`
    }

    // Default to https for anything else
    return `https://${normalized}`
}

function resolveFrontendBaseUrl(req, fallback) {
    const origin = req?.headers?.origin
    const envCandidate =
        process.env.FRONTEND_URL ||
        process.env.WEBAPP_URL ||
        process.env.NEXT_PUBLIC_WEB_URL ||
        (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : null)
    const candidate = origin || envCandidate || fallback
    return ensureAbsoluteUrl(candidate, fallback)
}

function buildPaymentReturnUrl(baseOrFullUrl, txRef, appRedirect) {
    const safeBase = ensureAbsoluteUrl(baseOrFullUrl, 'http://localhost:3001')
    const hasPath = /\/payment\/success(\?|$)/i.test(safeBase)
    const base = hasPath ? safeBase : `${safeBase.replace(/\/$/, '')}/payment/success`
    const separator = base.includes('?') ? '&' : '?'
    let full = `${base}${separator}tx_ref=${encodeURIComponent(txRef)}`
    if (appRedirect) {
        full += `&app_redirect=${encodeURIComponent(appRedirect)}`
    }
    return full
}

function parseCallbackData(callbackData) {
    if (!callbackData) return {}
    if (typeof callbackData === 'object') return callbackData
    if (typeof callbackData === 'string') {
        try {
            return JSON.parse(callbackData)
        } catch (e) {
            return {}
        }
    }
    return {}
}

async function grantConsultCreditsIfNeeded(transaction, txRef) {
    const callbackDataObj = parseCallbackData(transaction.callbackData)
    if (!(callbackDataObj && callbackDataObj.type === 'consult_purchase')) return
    if (callbackDataObj.consultCreditsGrantedAt) return

    const { doctorId, quantity } = callbackDataObj
    const qty = Number(quantity || 0)
    if (!doctorId || qty <= 0) return

    const db = require('../../models').sequelize
    await db.transaction(async (t) => {
        const tx = await PaymentTransaction.findByPk(transaction.id, {
            lock: true,
            transaction: t
        })
        const freshCallbackData = parseCallbackData(tx.callbackData)
        if (freshCallbackData.consultCreditsGrantedAt) return

        let profile = await UserProfile.findOne({
            where: { userId: tx.userId },
            lock: true,
            transaction: t
        })

        if (!profile) {
            profile = await UserProfile.create({
                userId: tx.userId,
                availableConsults: qty
            }, { transaction: t })
        } else {
            await profile.increment('availableConsults', { by: qty, transaction: t })
        }

        tx.callbackData = {
            ...freshCallbackData,
            consultCreditsGrantedAt: new Date().toISOString()
        }
        await tx.save({ transaction: t })
    })

    console.log('[Payment] ✅ Consult credits granted (idempotent)', {
        tx_ref: txRef,
        user_id: transaction.userId,
        doctor_id: doctorId,
        quantity: qty
    })
}

async function finalizeTransactionByTxRef(txRef) {
    const transaction = await PaymentTransaction.findOne({ where: { txRef } })
    if (!transaction) return { transaction: null, subscription: null, status: 'not_found' }

    if (transaction.status === 'pending') {
        try {
            const verificationData = await verifyTransaction(txRef)
            if (verificationData.status === 'success') {
                transaction.status = 'success'
                transaction.chapaRefId = verificationData.data?.chapa_reference || null
                transaction.paymentMethod = detectPaymentMethod(verificationData)
                transaction.completedAt = new Date()
                transaction.verificationData = verificationData
                transaction.verifiedAt = new Date()
                await transaction.save()
            }
        } catch (e) {
            console.warn('[Payment finalize] Chapa verify failed:', e.message)
        }
    }

    if (transaction.status === 'success') {
        await grantConsultCreditsIfNeeded(transaction, txRef)
    }

    let subscription = null
    if (transaction.status === 'success' && transaction.subscriptionPlanId && transaction.trainerId) {
        const { getUserSubscription } = require('../../services/subscriptionService')
        subscription = await getUserSubscription(transaction.userId)
        if (!subscription) {
            const callbackDataObj = parseCallbackData(transaction.callbackData)
            const duration = callbackDataObj.duration || 'monthly'
            subscription = await activateSubscription(transaction, duration)
        }
    }

    return { transaction, subscription, status: transaction.status }
}

/**
 * Get price based on duration
 */
function getPriceForDuration(plan, duration) {
    switch (duration) {
        case 'daily':
            return parseFloat(plan.dailyPrice)
        case 'monthly':
            return parseFloat(plan.monthlyPrice)
        case 'threeMonth':
            return parseFloat(plan.threeMonthPrice)
        case 'sixMonth':
            return parseFloat(plan.sixMonthPrice)
        case 'nineMonth':
            return parseFloat(plan.nineMonthPrice)
        case 'yearly':
            return parseFloat(plan.yearlyPrice)
        default:
            return parseFloat(plan.dailyPrice)
    }
}

/**
 * Calculate expiration date based on duration
 */
function calculateExpirationDate(duration, startDate = new Date()) {
    const start = new Date(startDate)
    switch (duration) {
        case 'daily':
            start.setDate(start.getDate() + 1)
            break
        case 'monthly':
            start.setMonth(start.getMonth() + 1)
            break
        case 'threeMonth':
            start.setMonth(start.getMonth() + 3)
            break
        case 'sixMonth':
            start.setMonth(start.getMonth() + 6)
            break
        case 'nineMonth':
            start.setMonth(start.getMonth() + 9)
            break
        case 'yearly':
            start.setFullYear(start.getFullYear() + 1)
            break
        default:
            start.setDate(start.getDate() + 1)
    }
    return start
}

/**
 * Detect payment method from verification data
 */
function detectPaymentMethod(verificationData) {
    if (!verificationData.data || !verificationData.data.payment_method) {
        return 'other'
    }

    const method = (verificationData.data.payment_method || '').toLowerCase()

    const methods = {
        'card': 'card',
        'telebirr': 'telebirr',
        'cbebirr': 'cbebirr',
        'awashbirr': 'awashbirr',
        'bank': 'bank',
        'mpesa': 'mpesa',
    }

    return methods[method] || 'other'
}

/**
 * Initialize payment for subscription
 * POST /api/v1/payments/subscription/initialize
 */
router.post('/subscription/initialize', requireAuth, async (req, res) => {
    try {
        const { subscription_plan_id, trainer_id, duration, phone_number, email } = req.body
        const user = req.user

        // Validation
        if (!subscription_plan_id) {
            return err(res, { code: 'BAD_REQUEST', message: 'Subscription plan ID is required' }, 400)
        }

        if (!trainer_id) {
            return err(res, { code: 'BAD_REQUEST', message: 'Trainer ID is required' }, 400)
        }

        if (!duration) {
            return err(res, { code: 'BAD_REQUEST', message: 'Duration is required' }, 400)
        }

        if (!phone_number) {
            return err(res, { code: 'BAD_REQUEST', message: 'Phone number is required' }, 400)
        }

        // Validate phone number format (Ethiopian format: 09xxxxxxxx or 07xxxxxxxx)
        const phoneRegex = /^(09|07)[0-9]{8}$/
        if (!phoneRegex.test(phone_number)) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Phone number must start with 09 or 07 followed by 8 digits'
            }, 400)
        }

        // Get subscription plan
        const plan = await SubscriptionPlan.findByPk(subscription_plan_id)
        if (!plan) {
            return err(res, { code: 'NOT_FOUND', message: 'Subscription plan not found' }, 404)
        }

        if (!plan.active) {
            return err(res, { code: 'BAD_REQUEST', message: 'This subscription plan is not available' }, 400)
        }

        // Verify trainer exists
        const trainer = await User.findByPk(trainer_id)
        if (!trainer || !trainer.isTrainer) {
            return err(res, { code: 'NOT_FOUND', message: 'Trainer not found' }, 404)
        }

        // Get price for duration
        const amount = getPriceForDuration(plan, duration)

        // Generate unique transaction reference
        const txRef = `SUB-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Split user name into first and last name
        const nameParts = (user.name || '').split(' ', 2)
        const firstName = nameParts[0] || user.name || 'User'
        const lastName = nameParts[1] || ''

        // Construct URLs from environment variables and ensure they are valid absolute URLs
        const rawFrontendUrl = resolveFrontendBaseUrl(req, 'http://localhost:3001')
        const rawBackendUrl = process.env.BACKEND_URL || 
            `http://localhost:${process.env.PORT || 3000}`

        const frontendUrl = ensureAbsoluteUrl(rawFrontendUrl, 'http://localhost:3001')
        const backendUrl = ensureAbsoluteUrl(rawBackendUrl, `http://localhost:${process.env.PORT || 3000}`)
        const paymentReturnBase = ensureAbsoluteUrl(
            process.env.PAYMENT_RETURN_URL || process.env.CHAPA_RETURN_URL || frontendUrl,
            frontendUrl
        )

        // Validate and format email for Chapa
        // Chapa requires a valid email format and rejects test domains
        // Priority: provided email > user.email > generated email
        let customerEmail = email || user.email
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
        // List of test/invalid email domains that Chapa rejects
        const invalidDomains = [
            'test.com',
            'example.com',
            'test.test',
            'invalid.com',
            'fake.com',
            'dummy.com'
        ]
        
        // Check if provided email uses an invalid domain
        if (customerEmail && emailRegex.test(customerEmail)) {
            const emailDomain = customerEmail.split('@')[1]?.toLowerCase()
            if (emailDomain && invalidDomains.includes(emailDomain)) {
                return err(res, {
                    code: 'VALIDATION_ERROR',
                    message: 'The payment gateway does not accept test email addresses. Please use a valid email address (e.g., Gmail, Yahoo, Outlook, or your company email).',
                }, 400)
            }
        }
        
        if (!customerEmail || !emailRegex.test(customerEmail)) {
            // Create a valid email from phone number (remove + and spaces, keep only digits)
            const cleanPhone = (phone_number || user.phone || '').replace(/[^\d]/g, '').replace(/^251/, '')
            if (cleanPhone && cleanPhone.length >= 9) {
                customerEmail = `user${cleanPhone}@axumpulse.com`
            } else {
                // Final fallback
                customerEmail = `user${user.id}@axumpulse.com`
            }
        }

        // Final validation - ensure email is valid
        if (!emailRegex.test(customerEmail)) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Invalid email format. Please provide a valid email address.',
            }, 400)
        }

        console.log('Using email for Chapa payment:', customerEmail)

        // Prepare payment data
        const paymentData = {
            amount: String(amount),
            currency: 'ETB',
            email: customerEmail,
            tx_ref: txRef,
            first_name: firstName,
            last_name: lastName,
            phone_number: phone_number,
            callback_url: `${backendUrl}/api/v1/payments/chapa/callback/${txRef}`,
            return_url: `${backendUrl}/api/v1/payments/return/${txRef}?frontend=${encodeURIComponent(paymentReturnBase)}`,
            customization: {
                title: (process.env.APP_NAME || 'Compound 360').substring(0, 16),
                description: `Payment for ${plan.name} subscription`.substring(0, 50),
            },
        }

        // Initialize payment with Chapa
        const payment = await initializePayment(paymentData)

        // Log response for debugging
        console.log('Chapa payment initialization response:', {
            response: payment,
            user_id: user.id,
            plan_id: plan.id,
            tx_ref: txRef,
        })

        // Check if initialization was successful
        if (!payment.status || payment.status !== 'success') {
            console.error('Chapa payment initialization failed:', {
                response: payment,
                user_id: user.id,
                plan_id: plan.id,
                payment_data: paymentData,
            })

            return err(res, {
                code: 'PAYMENT_INIT_FAILED',
                message: 'Failed to initialize payment',
                error: payment.message || 'Unknown error',
            }, 400)
        }

        // Verify checkout_url exists
        if (!payment.data || !payment.data.checkout_url) {
            console.error('Chapa checkout URL missing:', {
                response: payment,
                user_id: user.id,
            })

            return err(res, {
                code: 'PAYMENT_INIT_FAILED',
                message: 'Payment initialized but checkout URL not received',
                error: 'Invalid response from payment gateway',
            }, 500)
        }

        // Create payment transaction record
        // Store duration in callbackData for later use during activation
        await PaymentTransaction.create({
            userId: user.id,
            subscriptionPlanId: plan.id,
            trainerId: trainer.id,
            txRef: txRef,
            amount: amount,
            currency: 'ETB',
            status: 'pending',
            customerEmail: customerEmail,
            customerName: user.name || 'User',
            customerPhone: phone_number,
            callbackData: { duration } // Store duration for activation
        })

        return ok(res, {
            checkout_url: payment.data.checkout_url,
            tx_ref: txRef,
        })

    } catch (error) {
        console.error('Chapa payment exception:', {
            error: error.message,
            user_id: req.user?.id,
            plan_id: req.body?.subscription_plan_id,
            email: req.body?.email,
            stack: error.stack,
            response: error.response?.data,
            responseStatus: error.response?.status,
        })

        // Extract error information from Chapa API response
        const chapaError = error.response?.data
        const errorMessage = error.message || ''
        
        // Try to extract message from various possible Chapa error response formats
        let chapaErrorMessage = ''
        if (chapaError) {
            chapaErrorMessage = chapaError.message || 
                               chapaError.error || 
                               chapaError.data?.message ||
                               (typeof chapaError === 'string' ? chapaError : '') ||
                               ''
        }
        
        // Combine all possible error messages for detection
        const allErrorText = `${errorMessage} ${chapaErrorMessage}`.toLowerCase()
        
        // Check for email-related errors from Chapa
        const emailErrorIndicators = [
            'email',
            'invalid email',
            'email format',
            'email address',
            'customer email',
            'test.com',
            'test email'
        ]
        
        const isEmailError = emailErrorIndicators.some(indicator => 
            allErrorText.includes(indicator)
        )
        
        // Check if it's a 400 Bad Request from Chapa (often indicates validation error)
        const isChapaValidationError = error.response?.status === 400
        
        // Only return a specific email validation message when we are confident
        // the gateway error is actually about the email, instead of any generic 400.
        if (isEmailError) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'The payment gateway does not accept this email address. Please use a valid email address (e.g., Gmail, Yahoo, Outlook, or your company email).',
            }, 400)
        }

        // Return user-friendly error message
        const userFriendlyMessage = chapaErrorMessage || 
                                   (error.response?.status === 400 ? 'Invalid payment information. Please check your details and try again.' : 
                                    'Payment initialization failed. Please try again later or contact support if the problem persists.')

        return err(res, {
            code: isChapaValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
            message: userFriendlyMessage,
        }, isChapaValidationError ? 400 : 500)
    }
})

/**
 * Initialize payment for consult purchase
 * POST /api/v1/payments/consult/initialize
 */
router.post('/consult/initialize', requireAuth, async (req, res) => {
    try {
        const { doctorId, quantity = 1, phone_number, email, return_url, app_redirect } = req.body
        const user = req.user

        // Validation
        if (!doctorId) {
            return err(res, { code: 'BAD_REQUEST', message: 'Doctor ID is required' }, 400)
        }

        if (!phone_number) {
            return err(res, { code: 'BAD_REQUEST', message: 'Phone number is required' }, 400)
        }

        // Validate phone number format (Ethiopian format: 09xxxxxxxx or 07xxxxxxxx)
        const phoneRegex = /^(09|07)[0-9]{8}$/
        if (!phoneRegex.test(phone_number)) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Phone number must start with 09 or 07 followed by 8 digits'
            }, 400)
        }

        const quantityNum = parseInt(quantity)
        if (isNaN(quantityNum) || quantityNum < 1) {
            return err(res, { code: 'BAD_REQUEST', message: 'Quantity must be at least 1' }, 400)
        }

        // Get doctor and verify they have a consult fee set
        const doctor = await User.findOne({
            where: { id: doctorId, isMedical: true },
            include: [{
                model: MedicalProfessional,
                as: 'medicalProfessional',
                where: { verified: true },
                required: true
            }]
        })

        if (!doctor || !doctor.medicalProfessional) {
            return err(res, { code: 'NOT_FOUND', message: 'Doctor not found or not verified' }, 404)
        }

        const consultFee = parseFloat(doctor.medicalProfessional.consultFee)
        if (!consultFee || consultFee <= 0) {
            return err(res, { code: 'BAD_REQUEST', message: 'Doctor has not set a consult fee' }, 400)
        }

        // Calculate total amount
        const amount = consultFee * quantityNum

        // Generate unique transaction reference
        const txRef = `CONSULT-${user.id}-${doctorId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Construct URLs from environment variables (same as subscription payment) and normalize
        const rawFrontendUrl = resolveFrontendBaseUrl(req, 'http://localhost:3001')
        const rawBackendUrl = process.env.API_BASE_URL || 
            process.env.BACKEND_URL || 
            `http://localhost:${process.env.PORT || 3000}`

        const frontendUrl = ensureAbsoluteUrl(rawFrontendUrl, 'http://localhost:3001')
        const backendUrl = ensureAbsoluteUrl(rawBackendUrl, `http://localhost:${process.env.PORT || 3000}`)
        const paymentReturnBase = ensureAbsoluteUrl(
            return_url || process.env.PAYMENT_RETURN_URL || process.env.CHAPA_RETURN_URL || frontendUrl,
            frontendUrl
        )

        // Validate and sanitize email (similar to subscription payment)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        let customerEmail = email || user.email

        // List of invalid email domains that Chapa doesn't accept
        const invalidDomains = [
            'test.com',
            'example.com',
            'testmail.com',
            'mailinator.com',
            '10minutemail.com',
            'guerrillamail.com',
            'tempmail.com',
            'throwaway.email',
            'yopmail.com',
            'mohmal.com',
            'fakeinbox.com',
            'trashmail.com',
            'getnada.com',
            'maildrop.cc',
            'mintemail.com',
            'sharklasers.com',
            'grr.la',
            'guerrillamailblock.com',
            'pokemail.net',
            'spam4.me',
            'bccto.me',
            'chammy.info',
            'devnullmail.com',
            'dispostable.com',
            'emailondeck.com',
            'frapmail.com',
            'getairmail.com',
            'getmails.eu',
            'gishpuppy.com',
            'inboxalias.com',
            'meltmail.com',
            'melt.li',
            'mintemail.com',
            'mohmal.com',
            'mytrashmail.com',
            'nowemail.me',
            'nowmymail.com',
            'putthisinyourspamdatabase.com',
            'rcpt.at',
            'recode.me',
            'safetymail.info',
            'sendspamhere.com',
            'spamherelots.com',
            'spamhereplease.com',
            'spamhole.com',
            'spamify.com',
            'tempail.com',
            'tempalias.com',
            'tempe-mail.com',
            'tempemail.biz',
            'tempinbox.co.uk',
            'tempinbox.com',
            'tempmail.it',
            'tempmail2.com',
            'tempymail.com',
            'thankyou2010.com',
            'thisisnotmyrealemail.com',
            'tmail.ws',
            'tradermail.info',
            'trash-amil.com',
            'trashmail.at',
            'trashmail.com',
            'trashmail.de',
            'trashmail.me',
            'trashmail.net',
            'trashmail.org',
            'trashymail.com',
            'tyldd.com',
            'wh4f.org',
            'whyspam.me',
            'willselfdestruct.com',
            'winemaven.info',
            'wronghead.com',
            'wuzup.net',
            'wuzupmail.net',
            'xagloo.com',
            'xemaps.com',
            'xents.com',
            'xmaily.com',
            'xoxy.net',
            'yapped.net',
            'yeah.net',
            'yogamaven.com',
            'yopmail.com',
            'yopmail.fr',
            'yopmail.net',
            'youmailr.com',
            'ypmail.webnast.net',
            'zippymail.info',
            'zoemail.org'
        ]
        
        // Check if provided email uses an invalid domain
        if (customerEmail && emailRegex.test(customerEmail)) {
            const emailDomain = customerEmail.split('@')[1]?.toLowerCase()
            if (emailDomain && invalidDomains.includes(emailDomain)) {
                return err(res, {
                    code: 'VALIDATION_ERROR',
                    message: 'The payment gateway does not accept test email addresses. Please use a valid email address (e.g., Gmail, Yahoo, Outlook, or your company email).',
                }, 400)
            }
        }
        
        if (!customerEmail || !emailRegex.test(customerEmail)) {
            // Create a valid email from phone number (remove + and spaces, keep only digits)
            const cleanPhone = (phone_number || user.phone || '').replace(/[^\d]/g, '').replace(/^251/, '')
            if (cleanPhone && cleanPhone.length >= 9) {
                customerEmail = `user${cleanPhone}@axumpulse.com`
            } else {
                // Final fallback
                customerEmail = `user${user.id}@axumpulse.com`
            }
        }

        // Final validation - ensure email is valid
        if (!emailRegex.test(customerEmail)) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Invalid email format. Please provide a valid email address.',
            }, 400)
        }

        console.log('Using email for Chapa payment:', customerEmail)

        // Prepare payment data for Chapa
        // Sanitize doctor name for description (remove special characters that might cause issues)
        const sanitizedDoctorName = (doctor.name || 'Doctor').replace(/[^\w\s-]/g, '').trim()
        const description = `Purchase ${quantityNum} consult${quantityNum > 1 ? 's' : ''} from ${sanitizedDoctorName}`.substring(0, 50)
        
        const paymentData = {
            amount: String(amount),
            currency: 'ETB',
            email: customerEmail,
            first_name: user.name?.split(' ')[0] || 'User',
            last_name: user.name?.split(' ').slice(1).join(' ') || '',
            phone_number: phone_number,
            tx_ref: txRef,
            callback_url: `${backendUrl}/api/v1/payments/chapa/callback/${txRef}`,
            return_url: `${backendUrl}/api/v1/payments/return/${txRef}?frontend=${encodeURIComponent(paymentReturnBase)}${app_redirect ? `&app_redirect=${encodeURIComponent(app_redirect)}` : ''}`,
            customization: {
                title: 'Consult Purchase'.substring(0, 16),
                description: description
            }
        }

        // Log payment data for debugging (without sensitive info)
        console.log('Chapa payment data (consult):', {
            amount: paymentData.amount,
            currency: paymentData.currency,
            email: paymentData.email,
            tx_ref: paymentData.tx_ref,
            customization: paymentData.customization
        })

        // Initialize payment with Chapa
        const payment = await initializePayment(paymentData)

        // Check if initialization was successful
        if (!payment.status || payment.status !== 'success') {
            console.error('Chapa payment initialization failed:', {
                response: payment,
                user_id: user.id,
                doctor_id: doctorId,
            })

            return err(res, {
                code: 'PAYMENT_INIT_FAILED',
                message: 'Failed to initialize payment',
                error: payment.message || 'Unknown error',
            }, 400)
        }

        // Verify checkout_url exists
        if (!payment.data || !payment.data.checkout_url) {
            console.error('Chapa checkout URL missing:', {
                response: payment,
                user_id: user.id,
            })

            return err(res, {
                code: 'PAYMENT_INIT_FAILED',
                message: 'Payment initialized but checkout URL not received',
                error: 'Invalid response from payment gateway',
            }, 500)
        }

        // Create payment transaction record
        // Store type, doctorId, and quantity in callbackData for later use during activation
        await PaymentTransaction.create({
            userId: user.id,
            txRef: txRef,
            amount: amount,
            currency: 'ETB',
            status: 'pending',
            customerEmail: customerEmail,
            customerName: user.name || 'User',
            customerPhone: phone_number,
            callbackData: { 
                type: 'consult_purchase',
                doctorId: doctorId,
                quantity: quantityNum
            }
        })

        return ok(res, {
            checkout_url: payment.data.checkout_url,
            tx_ref: txRef,
        })

    } catch (error) {
        console.error('Consult purchase payment exception:', {
            error: error.message,
            user_id: req.user?.id,
            doctor_id: req.body?.doctorId,
            email: req.body?.email,
            stack: error.stack,
            response: error.response?.data,
            responseStatus: error.response?.status,
        })

        // Check if this is a Chapa validation error
        const isChapaValidationError = error.response?.status === 400
        const chapaErrorMessage = error.response?.data?.message
        
        // Check if email is the issue
        const isEmailError = error.response?.data?.message?.email || 
                            (chapaErrorMessage && typeof chapaErrorMessage === 'object' && chapaErrorMessage.email)
        
        // Only show the email-specific error when the gateway clearly points to email
        if (isEmailError) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'The payment gateway does not accept this email address. Please use a valid email address (e.g., Gmail, Yahoo, Outlook, or your company email).',
            }, 400)
        }

        // Return user-friendly error message
        const userFriendlyMessage = chapaErrorMessage || 
                                   (error.response?.status === 400 ? 'Invalid payment information. Please check your details and try again.' : 
                                    'Payment initialization failed. Please try again later or contact support if the problem persists.')

        return err(res, {
            code: isChapaValidationError ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR',
            message: userFriendlyMessage,
        }, isChapaValidationError ? 400 : 500)
    }
})

/**
 * Handle Chapa payment callback
 * GET /api/v1/payments/chapa/callback/:reference
 */
router.get('/chapa/callback/:reference', async (req, res) => {
    try {
        const { reference } = req.params

        // Verify transaction with Chapa
        const verificationData = await verifyTransaction(reference)

        // Find the payment transaction
        const transaction = await PaymentTransaction.findOne({ where: { txRef: reference } })

        if (!transaction) {
            console.warn('Payment transaction not found for callback', { tx_ref: reference })
            return err(res, { code: 'NOT_FOUND', message: 'Transaction not found' }, 404)
        }

        // Update transaction with callback and verification data
        // Merge existing callbackData with new query params
        const existingCallbackData = transaction.callbackData || {}
        transaction.callbackData = { ...existingCallbackData, ...req.query }
        transaction.verificationData = verificationData
        transaction.verifiedAt = new Date()

        // Check if payment was successful
        if (verificationData.status === 'success') {
            transaction.status = 'success'
            transaction.chapaRefId = verificationData.data?.chapa_reference || null
            transaction.paymentMethod = detectPaymentMethod(verificationData)
            transaction.completedAt = new Date()

            // Parse callbackData to determine transaction type
            let callbackDataObj = transaction.callbackData
            if (typeof callbackDataObj === 'string') {
                try {
                    callbackDataObj = JSON.parse(callbackDataObj)
                } catch (e) {
                    console.warn('[Payment Callback] Failed to parse callbackData as JSON:', e.message)
                }
            }

            // Check if this is a consult purchase
            if (callbackDataObj && callbackDataObj.type === 'consult_purchase') {
                try {
                    await grantConsultCreditsIfNeeded(transaction, reference)
                } catch (consultError) {
                    console.error('[Payment Callback] ❌ CRITICAL: Failed to process consult purchase:', {
                        error: consultError.message,
                        tx_ref: reference,
                        user_id: transaction.userId,
                        stack: consultError.stack
                    })
                }
            } else {
                // Handle subscription activation (existing logic)
                // CRITICAL: Activate subscription immediately when payment succeeds
                // Get duration from callbackData (stored during initialization)
                let duration = 'monthly' // Default fallback
                try {
                    // Extract duration from the object
                    if (callbackDataObj && callbackDataObj.duration) {
                        duration = callbackDataObj.duration
                    } else {
                        console.warn('[Payment Callback] Duration not found in callbackData, using default: monthly')
                    }
                } catch (e) {
                    console.warn('[Payment Callback] Error extracting duration from callbackData:', e.message)
                }
                
                console.log('[Payment Callback] Activating subscription with duration:', duration)

                // ACTIVATE SUBSCRIPTION - This is critical!
                try {
                    const subscription = await activateSubscription(transaction, duration)
                    console.log('[Payment Callback] ✅ Subscription activated successfully!', {
                        tx_ref: reference,
                        user_id: transaction.userId,
                        plan_id: transaction.subscriptionPlanId,
                        trainer_id: transaction.trainerId,
                        duration: duration,
                        subscription_id: subscription.id
                    })
                } catch (activationError) {
                    console.error('[Payment Callback] ❌ CRITICAL: Failed to activate subscription:', {
                        error: activationError.message,
                        tx_ref: reference,
                        user_id: transaction.userId,
                        plan_id: transaction.subscriptionPlanId,
                        trainer_id: transaction.trainerId,
                        duration: duration,
                        stack: activationError.stack,
                        transaction_data: {
                            subscriptionPlanId: transaction.subscriptionPlanId,
                            trainerId: transaction.trainerId,
                            userId: transaction.userId,
                            callbackData: transaction.callbackData
                        }
                    })
                    // Still mark transaction as success, but subscription activation failed
                    // The verify endpoint will retry activation when user visits success page
                }
            }
        } else {
            transaction.status = 'failed'
            console.warn('[Payment Callback] Payment verification failed', {
                tx_ref: reference,
                verification_status: verificationData.status,
            })
        }

        await transaction.save()

        return ok(res, {
            message: 'Callback processed',
            status: transaction.status,
        })

    } catch (error) {
        console.error('Chapa callback exception:', {
            error: error.message,
            tx_ref: req.params.reference,
            stack: error.stack,
        })

        return err(res, {
            code: 'INTERNAL_ERROR',
            message: 'Callback processing failed',
            error: error.message,
        }, 500)
    }
})

/**
 * Browser return endpoint from payment gateway.
 * This finalizes payment on backend (no frontend auth required),
 * then redirects user to web success page.
 * GET /api/v1/payments/return/:reference
 */
router.get('/return/:reference', async (req, res) => {
    try {
        const { reference } = req.params
        const frontendBase = req.query.frontend
            ? ensureAbsoluteUrl(String(req.query.frontend), process.env.PAYMENT_RETURN_URL || 'http://localhost:3001')
            : resolveFrontendBaseUrl(req, process.env.PAYMENT_RETURN_URL || 'http://localhost:3001')
        const appRedirect = req.query.app_redirect ? String(req.query.app_redirect) : undefined

        const finalized = await finalizeTransactionByTxRef(reference)
        if (!finalized.transaction) {
            const fallback = buildPaymentReturnUrl(frontendBase, reference, appRedirect)
            return res.redirect(fallback)
        }

        const redirectTo = buildPaymentReturnUrl(frontendBase, reference, appRedirect)
        return res.redirect(redirectTo)
    } catch (error) {
        console.error('Payment return handler failed:', error)
        const fallbackBase = process.env.PAYMENT_RETURN_URL || process.env.FRONTEND_URL || 'http://localhost:3001'
        const redirectTo = buildPaymentReturnUrl(fallbackBase, req.params.reference)
        return res.redirect(redirectTo)
    }
})


/**
 * Manual payment verification and subscription activation endpoint
 * GET /api/v1/payments/verify/:txRef
 * This endpoint verifies the payment and activates subscription if payment was successful
 */
router.get('/verify/:txRef', requireAuth, async (req, res) => {
    try {
        const { txRef } = req.params
        const userId = req.user.id

        const transaction = await PaymentTransaction.findOne({
            where: {
                txRef: txRef,
                userId: userId
            }
        })

        if (!transaction) {
            return err(res, { code: 'NOT_FOUND', message: 'Transaction not found' }, 404)
        }

        // If transaction is still pending, verify with Chapa first
        if (transaction.status === 'pending') {
            try {
                console.log('[Verify] Transaction is pending, verifying with Chapa...')
                const verificationData = await verifyTransaction(txRef)
                
                if (verificationData.status === 'success') {
                    transaction.status = 'success'
                    transaction.chapaRefId = verificationData.data?.chapa_reference || null
                    transaction.paymentMethod = detectPaymentMethod(verificationData)
                    transaction.completedAt = new Date()
                    transaction.verificationData = verificationData
                    transaction.verifiedAt = new Date()
                    await transaction.save()
                    console.log('[Verify] Payment verified as successful with Chapa')
                } else {
                    console.log('[Verify] Payment verification with Chapa shows status:', verificationData.status)
                }
            } catch (verifyError) {
                console.error('[Verify] Error verifying with Chapa:', verifyError.message)
                // Continue anyway - might be a network issue
            }
        }

        // Parse callbackData to determine transaction type
        let callbackDataObj = transaction.callbackData
        if (typeof callbackDataObj === 'string') {
            try {
                callbackDataObj = JSON.parse(callbackDataObj)
            } catch (e) {
                console.warn('[Verify] Failed to parse callbackData as JSON:', e.message)
            }
        }

        // Handle consult purchase if this is a consult purchase transaction
        if (transaction.status === 'success' && callbackDataObj && callbackDataObj.type === 'consult_purchase') {
            try {
                await grantConsultCreditsIfNeeded(transaction, txRef)
            } catch (consultError) {
                console.error('[Verify] ❌ CRITICAL: Failed to process consult purchase:', {
                    error: consultError.message,
                    tx_ref: txRef,
                    user_id: transaction.userId,
                    stack: consultError.stack
                })
            }
        }

        // CRITICAL: If payment was successful, ALWAYS try to activate subscription
        // This handles cases where Chapa callback didn't fire or failed
        if (transaction.status === 'success' && transaction.subscriptionPlanId && transaction.trainerId) {
            // Check if subscription already exists
            const { getUserSubscription } = require('../../services/subscriptionService')
            let existingSubscription = null
            try {
                existingSubscription = await getUserSubscription(userId)
            } catch (checkError) {
                console.warn('[Verify] Error checking existing subscription:', checkError.message)
            }
            
            // If no subscription exists, ACTIVATE IT NOW
            if (!existingSubscription) {
                try {
                    // Get duration from callbackData
                    let duration = 'monthly' // Default fallback
                    let callbackDataObj = transaction.callbackData
                    
                    // Parse callbackData if it's a string
                    if (typeof callbackDataObj === 'string') {
                        try {
                            callbackDataObj = JSON.parse(callbackDataObj)
                        } catch (e) {
                            console.warn('[Verify] Failed to parse callbackData as JSON, using default duration:', e.message)
                        }
                    }
                    
                    // Extract duration
                    if (callbackDataObj && callbackDataObj.duration) {
                        duration = callbackDataObj.duration
                    } else {
                        console.warn('[Verify] Duration not found in callbackData, using default: monthly')
                        console.log('[Verify] CallbackData content:', JSON.stringify(callbackDataObj))
                    }
                    
                    console.log('[Verify] ACTIVATING subscription for successful payment:', {
                        txRef: transaction.txRef,
                        userId: transaction.userId,
                        planId: transaction.subscriptionPlanId,
                        trainerId: transaction.trainerId,
                        duration: duration,
                        hasCallbackData: !!callbackDataObj
                    })
                    
                    // Activate subscription
                    const newSubscription = await activateSubscription(transaction, duration)
                    console.log('[Verify] ✅ Subscription activated successfully!', {
                        subscriptionId: newSubscription.id,
                        userId: newSubscription.userId,
                        trainerId: newSubscription.trainerId,
                        expiresAt: newSubscription.expiresAt
                    })
                } catch (activationError) {
                    console.error('[Verify] ❌ CRITICAL: Failed to activate subscription:', {
                        error: activationError.message,
                        stack: activationError.stack,
                        txRef: transaction.txRef,
                        userId: transaction.userId,
                        planId: transaction.subscriptionPlanId,
                        trainerId: transaction.trainerId
                    })
                    // Return error details so frontend can show it
                    return err(res, {
                        code: 'ACTIVATION_FAILED',
                        message: 'Payment was successful but subscription activation failed. Please contact support.',
                        error: activationError.message,
                        transaction: {
                            id: transaction.id,
                            txRef: transaction.txRef,
                            status: transaction.status
                        }
                    }, 500)
                }
            } else {
                console.log('[Verify] Subscription already exists for this user')
            }
        } else if (transaction.status === 'success') {
            console.warn('[Verify] Payment successful but missing required data:', {
                hasPlanId: !!transaction.subscriptionPlanId,
                hasTrainerId: !!transaction.trainerId,
                txRef: transaction.txRef
            })
        }

        // Check subscription status
        const { getUserSubscription } = require('../../services/subscriptionService')
        const subscription = await getUserSubscription(userId)

        return ok(res, {
            transaction: {
                id: transaction.id,
                txRef: transaction.txRef,
                status: transaction.status,
                amount: transaction.amount,
                createdAt: transaction.createdAt,
                completedAt: transaction.completedAt,
                callbackData: transaction.callbackData
            },
            subscription: subscription || null
        })
    } catch (error) {
        console.error('Payment verification error:', error)
        return err(res, {
            code: 'INTERNAL_ERROR',
            message: 'Verification failed',
            error: error.message,
        }, 500)
    }
})

/**
 * Auto-activate subscriptions for successful payments without subscriptions
 * POST /api/v1/payments/auto-activate-pending
 * This endpoint finds successful payments without subscriptions and activates them
 */
router.post('/auto-activate-pending', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { getUserSubscription, activateSubscription } = require('../../services/subscriptionService')
        
        // Check if user already has active subscription
        const existingSubscription = await getUserSubscription(userId)
        if (existingSubscription) {
            return ok(res, {
                message: 'User already has an active subscription',
                subscription: existingSubscription
            })
        }

        // Find successful payments without subscriptions
        const successfulPayments = await PaymentTransaction.findAll({
            where: {
                userId: userId,
                status: 'success',
                subscriptionPlanId: { [Op.ne]: null },
                trainerId: { [Op.ne]: null }
            },
            order: [['completedAt', 'DESC']]
        })

        if (successfulPayments.length === 0) {
            return ok(res, {
                message: 'No successful payments found that need activation',
                activated: 0
            })
        }

        const results = []
        for (const transaction of successfulPayments) {
            try {
                // Get duration from callbackData
                let duration = 'monthly'
                let callbackDataObj = transaction.callbackData
                
                if (typeof callbackDataObj === 'string') {
                    try {
                        callbackDataObj = JSON.parse(callbackDataObj)
                    } catch (e) {
                        console.warn('[Auto-Activate] Failed to parse callbackData:', e.message)
                    }
                }
                
                if (callbackDataObj && callbackDataObj.duration) {
                    duration = callbackDataObj.duration
                }

                console.log('[Auto-Activate] Activating subscription for payment:', {
                    txRef: transaction.txRef,
                    userId: transaction.userId,
                    planId: transaction.subscriptionPlanId,
                    trainerId: transaction.trainerId,
                    duration: duration
                })

                const subscription = await activateSubscription(transaction, duration)
                results.push({
                    txRef: transaction.txRef,
                    status: 'activated',
                    subscriptionId: subscription.id
                })
                console.log('[Auto-Activate] ✅ Subscription activated:', subscription.id)
                
                // Only activate the most recent one
                break
            } catch (error) {
                console.error('[Auto-Activate] Failed for transaction:', transaction.txRef, error.message)
                results.push({
                    txRef: transaction.txRef,
                    status: 'failed',
                    error: error.message
                })
            }
        }

        return ok(res, {
            message: `Processed ${successfulPayments.length} payment(s)`,
            activated: results.filter(r => r.status === 'activated').length,
            results: results
        })

    } catch (error) {
        console.error('[Auto-Activate] Error:', error)
        return err(res, {
            code: 'INTERNAL_ERROR',
            message: 'Auto-activation failed',
            error: error.message
        }, 500)
    }
})

/**
 * Manual subscription activation endpoint (admin only - for fixing issues)
 * POST /api/v1/payments/activate-subscription
 * Body: { txRef: string } or { userId: number, subscriptionPlanId: number, trainerId: number, duration: string }
 */
router.post('/activate-subscription', requireAuth, async (req, res) => {
    try {
        const { txRef, userId, subscriptionPlanId, trainerId, duration } = req.body
        const currentUser = req.user

        let transaction = null

        // If txRef provided, find transaction
        if (txRef) {
            transaction = await PaymentTransaction.findOne({
                where: { txRef }
            })

            if (!transaction) {
                return err(res, { code: 'NOT_FOUND', message: 'Transaction not found' }, 404)
            }

            // Check if user owns this transaction or is admin
            if (transaction.userId !== currentUser.id && !currentUser.isAdmin) {
                return err(res, { code: 'UNAUTHORIZED', message: 'Not authorized to activate this subscription' }, 403)
            }
        } else if (userId && subscriptionPlanId && trainerId && duration) {
            // Create a mock transaction object for direct activation
            // Check if user is admin or activating their own subscription
            if (userId !== currentUser.id && !currentUser.isAdmin) {
                return err(res, { code: 'UNAUTHORIZED', message: 'Not authorized' }, 403)
            }

            transaction = {
                userId: userId,
                subscriptionPlanId: subscriptionPlanId,
                trainerId: trainerId,
                txRef: `MANUAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
        } else {
            return err(res, { 
                code: 'BAD_REQUEST', 
                message: 'Either txRef or (userId, subscriptionPlanId, trainerId, duration) must be provided' 
            }, 400)
        }

        // Get duration
        let subscriptionDuration = duration || 'monthly'
        if (!duration && transaction.callbackData) {
            let callbackDataObj = transaction.callbackData
            if (typeof callbackDataObj === 'string') {
                try {
                    callbackDataObj = JSON.parse(callbackDataObj)
                } catch (e) {
                    console.warn('Failed to parse callbackData:', e)
                }
            }
            if (callbackDataObj && callbackDataObj.duration) {
                subscriptionDuration = callbackDataObj.duration
            }
        }

        console.log('[Manual Activation Endpoint] Activating subscription:', {
            userId: transaction.userId,
            subscriptionPlanId: transaction.subscriptionPlanId,
            trainerId: transaction.trainerId,
            duration: subscriptionDuration,
            txRef: transaction.txRef
        })

        // Activate subscription
        const subscription = await activateSubscription(transaction, subscriptionDuration)

        return ok(res, {
            message: 'Subscription activated successfully',
            subscription: subscription
        })

    } catch (error) {
        console.error('[Manual Activation Endpoint] Error:', {
            error: error.message,
            stack: error.stack
        })
        return err(res, {
            code: 'INTERNAL_ERROR',
            message: 'Failed to activate subscription',
            error: error.message
        }, 500)
    }
})

module.exports = router

