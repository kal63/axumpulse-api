'use strict'

const { UserSubscription, SubscriptionPlan, User } = require('../models')
const { Op } = require('sequelize')

/**
 * Calculate expiration date based on duration
 */
function calculateExpirationDate(duration, startDate = new Date()) {
    const start = new Date(startDate)
    switch (duration) {
        case 'daily':
            start.setDate(start.getDate() + 1)
            break
        case 'monthly':
            start.setMonth(start.getMonth() + 1)
            break
        case 'threeMonth':
            start.setMonth(start.getMonth() + 3)
            break
        case 'sixMonth':
            start.setMonth(start.getMonth() + 6)
            break
        case 'nineMonth':
            start.setMonth(start.getMonth() + 9)
            break
        case 'yearly':
            start.setFullYear(start.getFullYear() + 1)
            break
        default:
            start.setDate(start.getDate() + 1)
    }
    return start
}

function getPriceForDuration(plan, duration) {
    if (!plan) return 0
    switch (duration) {
        case 'daily':
            return parseFloat(plan.dailyPrice)
        case 'monthly':
            return parseFloat(plan.monthlyPrice)
        case 'threeMonth':
            return parseFloat(plan.threeMonthPrice)
        case 'sixMonth':
            return parseFloat(plan.sixMonthPrice)
        case 'nineMonth':
            return parseFloat(plan.nineMonthPrice)
        case 'yearly':
            return parseFloat(plan.yearlyPrice)
        default:
            return parseFloat(plan.monthlyPrice)
    }
}

function roundCurrency(amount) {
    const n = Number(amount || 0)
    return Math.round(n * 100) / 100
}

/**
 * Quote how much a user should pay for a subscription package change.
 * Policy:
 * - upgrades: pay (newPrice - oldPrice) prorated by remaining time
 * - downgrades or same price: pay 0 (no refund)
 */
function quoteSubscriptionChange({ currentSubscription, newPlan, duration, now = new Date() }) {
    const oldPlan = currentSubscription?.subscriptionPlan
    const startedAt = new Date(currentSubscription?.startedAt || now)
    const expiresAt = new Date(currentSubscription?.expiresAt || now)

    const nowDate = new Date(now)
    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - nowDate.getTime()) / 1000))
    const totalSeconds = Math.max(1, Math.floor((expiresAt.getTime() - startedAt.getTime()) / 1000))
    const remainingRatio = remainingSeconds / totalSeconds

    const oldPrice = getPriceForDuration(oldPlan, duration)
    const newPrice = getPriceForDuration(newPlan, duration)

    const rawDelta = newPrice - oldPrice
    const baseDelta = Math.max(rawDelta, 0)
    const amountDue = roundCurrency(baseDelta * remainingRatio)

    return {
        duration,
        oldPrice,
        newPrice,
        rawDelta,
        baseDelta,
        remainingSeconds,
        totalSeconds,
        remainingRatio,
        amountDue,
        isUpgrade: rawDelta > 0,
        isDowngrade: rawDelta < 0,
    }
}

/**
 * Create an active user subscription (same rules as post-payment activation).
 * @param {Object} opts
 * @param {number} opts.userId
 * @param {number} opts.trainerId
 * @param {number} opts.subscriptionPlanId
 * @param {string} [opts.duration]
 * @param {string|null} [opts.lastPaymentReference] tx ref or telco marker
 * @param {Date} [opts.startedAt]
 * @param {import('sequelize').Transaction} [opts.transaction]
 */
async function createActiveSubscriptionForUser({
    userId,
    trainerId,
    subscriptionPlanId,
    duration = 'monthly',
    lastPaymentReference = null,
    startedAt = new Date(),
    transaction = undefined,
}) {
    if (!subscriptionPlanId || !trainerId) {
        const error = new Error('Subscription plan ID and trainer ID are required')
        throw error
    }

    const user = await User.findByPk(userId, { transaction })
    const plan = await SubscriptionPlan.findByPk(subscriptionPlanId, { transaction })

    if (!user) {
        throw new Error(`User not found: ${userId}`)
    }
    if (!plan) {
        throw new Error(`Subscription plan not found: ${subscriptionPlanId}`)
    }

    const now = new Date(startedAt)
    const expiresAt = calculateExpirationDate(duration, now)

    await UserSubscription.update(
        { status: 'cancelled' },
        {
            where: {
                userId: user.id,
                trainerId,
                status: 'active',
            },
            transaction,
        }
    )

    return UserSubscription.create(
        {
            userId: user.id,
            trainerId,
            subscriptionPlanId: plan.id,
            duration,
            startedAt: now,
            expiresAt,
            status: 'active',
            lastPaymentReference,
        },
        { transaction }
    )
}

/**
 * Activate user subscription after payment
 * @param {Object} transaction - PaymentTransaction object
 * @param {string} duration - Subscription duration
 */
async function activateSubscription(transaction, duration = 'monthly') {
    console.log('[activateSubscription] Starting activation:', {
        userId: transaction.userId,
        subscriptionPlanId: transaction.subscriptionPlanId,
        trainerId: transaction.trainerId,
        duration: duration,
        txRef: transaction.txRef
    })

    if (!transaction.subscriptionPlanId || !transaction.trainerId) {
        const error = new Error('Subscription plan ID and trainer ID are required')
        console.error('[activateSubscription] Validation failed:', {
            subscriptionPlanId: transaction.subscriptionPlanId,
            trainerId: transaction.trainerId
        })
        throw error
    }

    try {
        const subscription = await createActiveSubscriptionForUser({
            userId: transaction.userId,
            trainerId: transaction.trainerId,
            subscriptionPlanId: transaction.subscriptionPlanId,
            duration,
            lastPaymentReference: transaction.txRef,
            startedAt: new Date(),
        })
        console.log('[activateSubscription] Subscription created successfully:', {
            subscriptionId: subscription.id,
            userId: subscription.userId,
            trainerId: subscription.trainerId,
            planId: subscription.subscriptionPlanId,
            expiresAt: subscription.expiresAt
        })
        return subscription
    } catch (createError) {
        console.error('[activateSubscription] Failed to create subscription:', {
            error: createError.message,
            stack: createError.stack,
        })
        throw createError
    }
}

/**
 * Get user's active subscription
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Active subscription or null
 */
async function getUserSubscription(userId) {
    const subscription = await UserSubscription.findOne({
        where: {
            userId,
            status: 'active',
            expiresAt: {
                [Op.gt]: new Date()
            }
        },
        include: [
            {
                model: SubscriptionPlan,
                as: 'subscriptionPlan'
            },
            {
                model: User,
                as: 'trainer',
                attributes: ['id', 'name', 'email', 'profilePicture']
            }
        ],
        order: [['expiresAt', 'DESC']]
    })

    return subscription
}

/**
 * Cancel user subscription
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
async function cancelSubscription(userId) {
    const result = await UserSubscription.update(
        { status: 'cancelled' },
        {
            where: {
                userId,
                status: 'active'
            }
        }
    )

    return result[0] > 0
}

/**
 * Check if user has active subscription to a trainer
 * @param {number} userId - User ID
 * @param {number} trainerId - Trainer ID (optional)
 * @returns {Promise<boolean>} Has active subscription
 */
async function hasActiveSubscription(userId, trainerId = null) {
    const where = {
        userId,
        status: 'active',
        expiresAt: {
            [Op.gt]: new Date()
        }
    }

    if (trainerId) {
        where.trainerId = trainerId
    }

    const count = await UserSubscription.count({ where })
    return count > 0
}

/**
 * Get trainer ID from user's active subscription
 * @param {number} userId - User ID
 * @returns {Promise<number|null>} Trainer ID or null
 */
async function getSubscribedTrainerId(userId) {
    try {
        const subscription = await getUserSubscription(userId)
        if (subscription) {
            console.log(`[getSubscribedTrainerId] Found active subscription for user ${userId}:`, {
                subscriptionId: subscription.id,
                trainerId: subscription.trainerId,
                status: subscription.status,
                expiresAt: subscription.expiresAt,
                isExpired: new Date() > new Date(subscription.expiresAt)
            })
            return subscription.trainerId
        } else {
            console.log(`[getSubscribedTrainerId] No active subscription found for user ${userId}`)
            return null
        }
    } catch (error) {
        console.error(`[getSubscribedTrainerId] Error getting subscription for user ${userId}:`, {
            error: error.message,
            stack: error.stack
        })
        return null
    }
}

async function changeUserSubscriptionPackage({
    userId,
    newSubscriptionPlanId,
    duration,
    newTrainerId,
    txRef,
    now = new Date(),
}) {
    const current = await getUserSubscription(userId)
    if (!current) {
        const error = new Error('No active subscription found')
        error.code = 'NO_ACTIVE_SUBSCRIPTION'
        throw error
    }

    const plan = await SubscriptionPlan.findByPk(newSubscriptionPlanId)
    if (!plan) {
        const error = new Error('Subscription plan not found')
        error.code = 'PLAN_NOT_FOUND'
        throw error
    }
    if (!plan.active) {
        const error = new Error('This subscription plan is not available')
        error.code = 'PLAN_INACTIVE'
        throw error
    }

    const targetTrainerId = newTrainerId || current.trainerId
    const keepExpiresAt = current.expiresAt
    const newDuration = duration || current.duration

    await UserSubscription.update(
        { status: 'cancelled' },
        { where: { id: current.id, status: 'active' } }
    )

    const subscription = await UserSubscription.create({
        userId,
        trainerId: targetTrainerId,
        subscriptionPlanId: plan.id,
        duration: newDuration,
        startedAt: now,
        expiresAt: keepExpiresAt,
        status: 'active',
        lastPaymentReference: txRef || null,
    })

    return subscription
}

async function changeUserSubscriptionTrainer({
    userId,
    newTrainerId,
    txRef,
    now = new Date(),
}) {
    const current = await getUserSubscription(userId)
    if (!current) {
        const error = new Error('No active subscription found')
        error.code = 'NO_ACTIVE_SUBSCRIPTION'
        throw error
    }

    const trainer = await User.findByPk(newTrainerId)
    if (!trainer || !trainer.isTrainer) {
        const error = new Error('Trainer not found')
        error.code = 'TRAINER_NOT_FOUND'
        throw error
    }

    await UserSubscription.update(
        { status: 'cancelled' },
        { where: { id: current.id, status: 'active' } }
    )

    const subscription = await UserSubscription.create({
        userId,
        trainerId: trainer.id,
        subscriptionPlanId: current.subscriptionPlanId,
        duration: current.duration,
        startedAt: now,
        expiresAt: current.expiresAt,
        status: 'active',
        lastPaymentReference: txRef || null,
    })

    return subscription
}

module.exports = {
    activateSubscription,
    createActiveSubscriptionForUser,
    getUserSubscription,
    cancelSubscription,
    hasActiveSubscription,
    getSubscribedTrainerId,
    calculateExpirationDate,
    getPriceForDuration,
    quoteSubscriptionChange,
    changeUserSubscriptionPackage,
    changeUserSubscriptionTrainer,
}

