'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { SubscriptionPlan } = require('../../models')
const { requireAuth } = require('../../middleware/auth')
const { getUserSubscription, quoteSubscriptionChange } = require('../../services/subscriptionService')

// POST /api/v1/subscription/change-package/quote
// Body: { new_subscription_plan_id: number, duration: string }
router.post('/quote', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { new_subscription_plan_id, duration } = req.body || {}

        if (!new_subscription_plan_id) {
            return err(res, { code: 'BAD_REQUEST', message: 'new_subscription_plan_id is required' }, 400)
        }
        if (!duration) {
            return err(res, { code: 'BAD_REQUEST', message: 'duration is required' }, 400)
        }

        const currentSubscription = await getUserSubscription(userId)
        if (!currentSubscription) {
            return err(res, { code: 'BAD_REQUEST', message: 'No active subscription found' }, 400)
        }

        const newPlan = await SubscriptionPlan.findByPk(new_subscription_plan_id)
        if (!newPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Subscription plan not found' }, 404)
        }
        if (!newPlan.active) {
            return err(res, { code: 'BAD_REQUEST', message: 'This subscription plan is not available' }, 400)
        }

        const quote = quoteSubscriptionChange({
            currentSubscription,
            newPlan,
            duration,
            now: new Date(),
        })

        return ok(res, {
            quote,
            current: {
                subscriptionId: currentSubscription.id,
                planId: currentSubscription.subscriptionPlanId,
                trainerId: currentSubscription.trainerId,
                duration: currentSubscription.duration,
                startedAt: currentSubscription.startedAt,
                expiresAt: currentSubscription.expiresAt,
            },
            newPlan: {
                id: newPlan.id,
                name: newPlan.name,
                level: newPlan.level,
            },
        })
    } catch (error) {
        console.error('Error quoting package change:', error)
        return err(res, error)
    }
})

module.exports = router

