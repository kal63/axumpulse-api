'use strict'

const { err } = require('../utils/errors')

function requireMedical(req, res, next) {
    if (!req.user || !req.user.isMedical) {
        return err(res, { code: 'FORBIDDEN', message: 'Medical professional only' }, 403)
    }
    next()
}

module.exports = { requireMedical }

