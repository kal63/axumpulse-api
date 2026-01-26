'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { SubscriptionPlan } = require('../../models')

// GET /api/v1/subscription/plans - Get all active subscription plans
router.get('/', async (req, res) => {
    try {
        const plans = await SubscriptionPlan.findAll({
            where: { active: true },
            order: [
                ['level', 'ASC'],
                ['name', 'ASC']
            ]
        })

        return ok(res, { items: plans })
    } catch (error) {
        console.error('Error fetching subscription plans:', error)
        return err(res, error)
    }
})

// GET /api/v1/subscription/plans/:id - Get plan details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const plan = await SubscriptionPlan.findByPk(id)

        if (!plan) {
            return err(res, { code: 'NOT_FOUND', message: 'Subscription plan not found' }, 404)
        }

        return ok(res, { plan })
    } catch (error) {
        console.error('Error fetching subscription plan:', error)
        return err(res, error)
    }
})

module.exports = router

