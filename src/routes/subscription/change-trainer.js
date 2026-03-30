'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { requireAuth } = require('../../middleware/auth')
const { changeUserSubscriptionTrainer, getUserSubscription } = require('../../services/subscriptionService')

// POST /api/v1/subscription/change-trainer
// Body: { new_trainer_id: number }
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { new_trainer_id } = req.body || {}

        if (!new_trainer_id) {
            return err(res, { code: 'BAD_REQUEST', message: 'new_trainer_id is required' }, 400)
        }

        const current = await getUserSubscription(userId)
        if (!current) {
            return err(res, { code: 'BAD_REQUEST', message: 'No active subscription found' }, 400)
        }

        if (Number(current.trainerId) === Number(new_trainer_id)) {
            return ok(res, { message: 'Trainer is unchanged', subscription: current })
        }

        const subscription = await changeUserSubscriptionTrainer({
            userId,
            newTrainerId: new_trainer_id,
            txRef: null,
            now: new Date(),
        })

        return ok(res, { message: 'Trainer changed successfully', subscription })
    } catch (error) {
        console.error('Error changing trainer:', error)
        return err(res, {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Failed to change trainer',
        }, 500)
    }
})

module.exports = router

