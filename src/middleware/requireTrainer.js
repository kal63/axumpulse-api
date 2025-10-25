'use strict'

const { err } = require('../utils/errors')

function requireTrainer(req, res, next) {
    if (!req.user || !req.user.isTrainer) {
        return err(res, { code: 'FORBIDDEN', message: 'Trainer only' }, 403)
    }
    next()
}

module.exports = { requireTrainer }








