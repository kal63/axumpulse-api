'use strict'

const { ok, err } = require('../../utils/errors')
const { User, SubscriptionPlan } = require('../../models')
const { isValidEthiopianPhone, normalizeEthiopianPhone } = require('../../utils/phone')
const { resolveActiveProductMapping, upsertTelcoPending } = require('../../services/ethiotellService')

/**
 * POST /api/v1/integrations/ethiotell/webhook
 * JSON body (parsed by express.json): { phone_number, password, product_number }
 * Legacy fields (still accepted if present): phone, planinfo, productCode, etc.
 */
async function postWebhook(req, res) {
    try {
        const body = req.body || {}
        const phoneRaw =
            body.phone_number ??
            body.phoneNumber ??
            body.phone ??
            body.userPhone ??
            body.msisdn ??
            body.mobilenumber
        const password = body.password ?? body.telcoPassword ?? body.pin
        const productNumber =
            body.product_number ??
            body.productNumber ??
            body.planinfo ??
            body.planInfo ??
            body.productCode ??
            body.code

        if (!phoneRaw || !password || productNumber == null || String(productNumber).trim() === '') {
            return err(
                res,
                { code: 'BAD_REQUEST', message: 'phone_number, password, and product_number are required' },
                400
            )
        }

        const normalizedPhone = normalizeEthiopianPhone(String(phoneRaw))
        if (!normalizedPhone || !isValidEthiopianPhone(normalizedPhone)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid Ethiopian phone number' }, 400)
        }

        const productCode = String(productNumber).trim()

        const mapping = await resolveActiveProductMapping(productCode)
        if (!mapping) {
            return err(res, { code: 'UNKNOWN_PRODUCT', message: 'Unknown product_number' }, 400)
        }

        const plan = await SubscriptionPlan.findByPk(mapping.subscriptionPlanId)
        if (!plan || !plan.active) {
            return err(res, { code: 'BAD_REQUEST', message: 'Subscription plan is missing or inactive' }, 400)
        }

        if (mapping.trainerId != null) {
            const trainer = await User.findByPk(mapping.trainerId)
            if (!trainer || !trainer.isTrainer) {
                return err(res, { code: 'BAD_REQUEST', message: 'Trainer is missing or invalid for this product' }, 400)
            }
        }

        const pending = await upsertTelcoPending({
            phone: normalizedPhone,
            telcoPasswordPlain: String(password),
            productCode,
            subscriptionPlanId: mapping.subscriptionPlanId,
            trainerId: mapping.trainerId,
            duration: mapping.duration,
            rawPayload: body,
        })

        return ok(res, {
            received: true,
            phone: pending.phone,
            productCode: pending.productCode,
        })
    } catch (e) {
        console.error('[Ethiotell webhook]', e)
        return err(res, { code: 'INTERNAL_ERROR', message: e.message || 'Webhook failed' }, 500)
    }
}

module.exports = {
    postWebhook,
}
