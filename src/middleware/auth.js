'use strict'

const jwt = require('jsonwebtoken')
const { err } = require('../utils/errors')

function requireAuth(req, res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return err(res, { code: 'UNAUTHORIZED', message: 'Missing token' }, 401)
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (e) {
        return err(res, { code: 'UNAUTHORIZED', message: 'Invalid token' }, 401)
    }
}

/**
 * Optional authentication middleware - sets req.user if token is valid, but doesn't fail if no token
 * Useful for routes that work both with and without authentication
 */
function optionalAuth(req, res, next) {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET)
        } catch (e) {
            // Invalid token, but don't fail - just continue without req.user
            req.user = null
        }
    }
    next()
}

module.exports = { requireAuth, optionalAuth }



