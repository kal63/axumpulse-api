'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { User, Trainer } = require('../../models')

// GET /trainer/me
router.get('/me', async (req, res) => {
    try {
        const userId = req.user?.id
        const trainer = await Trainer.findOne({
            where: { userId },
            include: [{ model: User }]
        })
        if (!trainer) return err(res, { code: 'NOT_TRAINER', message: 'Trainer profile not found' }, 404)
        ok(res, { trainer })
    } catch (error) {
        err(res, error)
    }
})

module.exports = router






