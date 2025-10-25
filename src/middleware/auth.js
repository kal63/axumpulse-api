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

module.exports = { requireAuth }



