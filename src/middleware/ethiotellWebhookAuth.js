'use strict'

/**
 * Ethiotell webhook HMAC verification — DISABLED (no `X-Ethiotell-Signature` required).
 * The previous implementation is preserved below in a block comment for easy restore.
 */
function verifyEthiotellWebhookSignature(req, res, next) {
    return next()
}

/*
'use strict'

const crypto = require('crypto')
const { err } = require('../utils/errors')

function clientIp(req) {
    const xf = String(req.headers['x-forwarded-for'] || '')
        .split(',')[0]
        .trim()
    if (xf) return xf
    return req.socket?.remoteAddress || ''
}

function ipAllowed(req) {
    const raw = process.env.ETHIOTELL_WEBHOOK_IPS
    if (!raw || !String(raw).trim()) return true
    const allowed = String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    if (allowed.length === 0) return true
    const ip = clientIp(req)
    return allowed.some((a) => ip === a || ip.endsWith(a))
}

function verifyEthiotellWebhookSignature(req, res, next) {
    if (!ipAllowed(req)) {
        return err(res, { code: 'FORBIDDEN', message: 'IP not allowed' }, 403)
    }
    const secret = process.env.ETHIOTELL_WEBHOOK_SECRET
    if (!secret || !String(secret).trim()) {
        return err(res, { code: 'SERVER_MISCONFIG', message: 'Ethiotell webhook is not configured' }, 503)
    }
    const sigHeader = req.headers['x-ethiotell-signature'] || req.headers['x-ethiotell-signature'.toLowerCase()]
    const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader
    if (!sig || typeof sig !== 'string' || !sig.startsWith('sha256=')) {
        return err(res, { code: 'UNAUTHORIZED', message: 'Missing or invalid signature header' }, 401)
    }
    const expectedHex = sig.slice('sha256='.length).trim()
    if (!/^[0-9a-fA-F]+$/.test(expectedHex) || expectedHex.length % 2 !== 0) {
        return err(res, { code: 'UNAUTHORIZED', message: 'Invalid signature format' }, 401)
    }
    const bodyBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '', 'utf8')
    const hmacHex = crypto.createHmac('sha256', secret).update(bodyBuf).digest('hex')
    let expectedSig
    let actualSig
    try {
        expectedSig = Buffer.from(expectedHex, 'hex')
        actualSig = Buffer.from(hmacHex, 'hex')
    } catch {
        return err(res, { code: 'UNAUTHORIZED', message: 'Invalid signature' }, 401)
    }
    if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
        return err(res, { code: 'UNAUTHORIZED', message: 'Invalid signature' }, 401)
    }
    let parsed
    try {
        parsed = JSON.parse(bodyBuf.toString('utf8'))
    } catch (e) {
        return err(res, { code: 'BAD_REQUEST', message: 'Invalid JSON body' }, 400)
    }
    req.ethiotellBodyParsed = parsed
    return next()
}
*/

module.exports = {
    verifyEthiotellWebhookSignature,
}
