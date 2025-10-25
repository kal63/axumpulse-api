'use strict'

const fs = require('fs')
const path = require('path')

const logDir = process.env.ACTION_LOG_DIR || './logs'
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
const filePath = path.join(logDir, 'admin-actions.ndjson')

function actionLogger(action, meta = {}) {
    return function (req, _res, next) {
        try {
            const line = JSON.stringify({
                ts: new Date().toISOString(),
                actorUserId: req.user?.id || null,
                action,
                meta,
            }) + '\n'
            fs.appendFile(filePath, line, () => { })
        } catch (_) { }
        next()
    }
}

module.exports = { actionLogger }



