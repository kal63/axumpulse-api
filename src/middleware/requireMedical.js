'use strict'

const { err } = require('../utils/errors')
const { User } = require('../models')

async function requireMedical(req, res, next) {
    if (!req.user || !req.user.id) {
        return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    try {
        // Fetch fresh user data from database to check isMedical status
        // This ensures role changes (like approval) are immediately effective
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'isMedical']
        })

        if (!user || !user.isMedical) {
            return err(res, { code: 'FORBIDDEN', message: 'Medical professional only' }, 403)
        }

        // Update req.user with fresh data
        req.user.isMedical = user.isMedical
        next()
    } catch (error) {
        console.error('Error checking medical status:', error)
        return err(res, { code: 'SERVER_ERROR', message: 'Failed to verify medical status' }, 500)
    }
}

module.exports = { requireMedical }

