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
        // Chapa requires a valid email format
        // Priority: provided email > user.email > generated email
        let customerEmail = email || user.email
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        
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
            stack: error.stack,
        })

        return err(res, {
            code: 'INTERNAL_ERROR',
            message: 'Payment initialization failed',
            error: error.message,
        }, 500)
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

            // Activate or extend subscription
            // Get duration from callbackData (stored during initialization)
            // callbackData might be a JSON string or object
            let duration = 'monthly'
            try {
                let callbackDataObj = transaction.callbackData
                
                // If callbackData is a string, parse it
                if (typeof callbackDataObj === 'string') {
                    try {
                        callbackDataObj = JSON.parse(callbackDataObj)
                    } catch (e) {
                        console.warn('Failed to parse callbackData as JSON:', e)
                    }
                }
                
                // Extract duration from the object
                if (callbackDataObj && callbackDataObj.duration) {
                    duration = callbackDataObj.duration
                } else {
                    // Try to get from the original stored data
                    // The duration was stored in callbackData during initialization
                    console.log('CallbackData structure:', JSON.stringify(callbackDataObj))
                }
            } catch (e) {
                console.warn('Error extracting duration from callbackData:', e)
            }
            
            console.log('Activating subscription with duration:', duration)

            try {
                await activateSubscription(transaction, duration)
                console.log('Payment successful and subscription activated', {
                    tx_ref: reference,
                    user_id: transaction.userId,
                    plan_id: transaction.subscriptionPlanId,
                    trainer_id: transaction.trainerId,
                    duration: duration
                })
            } catch (activationError) {
                console.error('Failed to activate subscription:', {
                    error: activationError.message,
                    tx_ref: reference,
                    user_id: transaction.userId,
                    plan_id: transaction.subscriptionPlanId,
                    trainer_id: transaction.trainerId,
                    duration: duration,
                    stack: activationError.stack
                })
                // Don't fail the callback, but log the error
                // The transaction is still marked as success, but subscription activation failed
            }
        } else {
            transaction.status = 'failed'

            console.warn('Payment verification failed', {
                tx_ref: reference,
                verification_data: verificationData,
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
 * Manual payment verification endpoint (for testing/debugging)
 * GET /api/v1/payments/verify/:txRef
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

module.exports = router

