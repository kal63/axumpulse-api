'use strict'

const { err } = require('../utils/errors')

function requireAdmin(req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        return err(res, { code: 'FORBIDDEN', message: 'Admin only' }, 403)
    }
    next()
}

module.exports = { requireAdmin }



