'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { initializePayment, verifyTransaction } = require('../../utils/chapaService')
const { PaymentTransaction, SubscriptionPlan, UserSubscription, User } = require('../../models')
const { requireAuth } = require('../../middleware/auth')
const { Op } = require('sequelize')
const { activateSubscription } = require('../../services/subscriptionService')

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

        // Construct URLs from environment variables
        const frontendUrl = process.env.FRONTEND_URL || 
            (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '') : 'http://localhost:3001')
        const backendUrl = process.env.BACKEND_URL || 
            `http://localhost:${process.env.PORT || 3000}`

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
            return_url: `${frontendUrl}/payment/success?tx_ref=${txRef}`,
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
        
        if (isEmailError || (isChapaValidationError && req.body?.email)) {
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

            // CRITICAL: Activate subscription immediately when payment succeeds
            // Get duration from callbackData (stored during initialization)
            let duration = 'monthly' // Default fallback
            try {
                let callbackDataObj = transaction.callbackData
                
                // If callbackData is a string, parse it
                if (typeof callbackDataObj === 'string') {
                    try {
                        callbackDataObj = JSON.parse(callbackDataObj)
                    } catch (e) {
                        console.warn('[Payment Callback] Failed to parse callbackData as JSON:', e.message)
                    }
                }
                
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
                completedAt: transaction.completedAt
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

