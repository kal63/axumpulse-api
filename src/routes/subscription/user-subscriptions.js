'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { UserSubscription, SubscriptionPlan, User } = require('../../models')
const { requireAuth } = require('../../middleware/auth')
const { Op } = require('sequelize')

// GET /api/v1/subscription/my-subscription - Get user's current subscription
router.get('/my-subscription', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id

        const subscription = await UserSubscription.findOne({
            where: {
                userId,
                status: 'active',
                expiresAt: {
                    [Op.gt]: new Date()
                }
            },
            include: [
                {
                    model: SubscriptionPlan,
                    as: 'subscriptionPlan'
                },
                {
                    model: User,
                    as: 'trainer',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }
            ],
            order: [['expiresAt', 'DESC']]
        })

        if (!subscription) {
            return ok(res, { subscription: null })
        }

        return ok(res, { subscription })
    } catch (error) {
        console.error('Error fetching user subscription:', error)
        return err(res, error)
    }
})

// POST /api/v1/subscription/subscribe - Initialize subscription (for authenticated users)
router.post('/subscribe', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { subscription_plan_id, trainer_id, duration, phone_number } = req.body

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

        // Return data for payment initialization
        // The actual payment initialization will be handled by the payment routes
        return ok(res, {
            message: 'Subscription data validated',
            subscription_plan_id,
            trainer_id,
            duration,
            plan: {
                id: plan.id,
                name: plan.name,
                level: plan.level
            },
            trainer: {
                id: trainer.id,
                name: trainer.name
            }
        })
    } catch (error) {
        console.error('Error initializing subscription:', error)
        return err(res, error)
    }
})

module.exports = router

