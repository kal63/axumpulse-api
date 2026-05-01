'use strict'

const bcrypt = require('bcrypt')
const { EthiotellProductPlan, TelcoPendingRegistration } = require('../models')
const { normalizeEthiopianPhone } = require('../utils/phone')

/**
 * @param {string} productCode
 * @returns {Promise<EthiotellProductPlan|null>}
 */
async function resolveActiveProductMapping(productCode) {
    const code = String(productCode || '').trim()
    if (!code) return null
    return EthiotellProductPlan.findOne({
        where: { productCode: code, active: true },
    })
}

/**
 * Upsert pending registration for a phone (latest webhook wins).
 * @param {Object} opts
 * @param {string} opts.phone normalized +251...
 * @param {string} opts.telcoPasswordPlain
 * @param {string} opts.productCode
 * @param {number} opts.subscriptionPlanId
 * @param {number|null|undefined} opts.trainerId
 * @param {string} opts.duration
 * @param {object} [opts.rawPayload]
 */
async function upsertTelcoPending({
    phone,
    telcoPasswordPlain,
    productCode,
    subscriptionPlanId,
    trainerId,
    duration,
    rawPayload = null,
}) {
    const normalized = normalizeEthiopianPhone(phone)
    const passwordHash = await bcrypt.hash(telcoPasswordPlain, 10)
    const existing = await TelcoPendingRegistration.findOne({ where: { phone: normalized } })
    if (existing) {
        await existing.update({
            passwordHash,
            productCode,
            subscriptionPlanId,
            trainerId,
            duration,
            rawPayload,
            consumedAt: null,
            consumedUserId: null,
        })
        return existing.reload()
    }
    return TelcoPendingRegistration.create({
        phone: normalized,
        passwordHash,
        productCode,
        subscriptionPlanId,
        trainerId,
        duration,
        rawPayload,
    })
}

module.exports = {
    resolveActiveProductMapping,
    upsertTelcoPending,
}
