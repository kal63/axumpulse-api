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

    const user = await User.findByPk(transaction.userId)
    const plan = await SubscriptionPlan.findByPk(transaction.subscriptionPlanId)

    if (!user) {
        const error = new Error(`User not found: ${transaction.userId}`)
        console.error('[activateSubscription] User not found:', transaction.userId)
        throw error
    }

    if (!plan) {
        const error = new Error(`Subscription plan not found: ${transaction.subscriptionPlanId}`)
        console.error('[activateSubscription] Plan not found:', transaction.subscriptionPlanId)
        throw error
    }

    const now = new Date()
    const expiresAt = calculateExpirationDate(duration, now)

    console.log('[activateSubscription] Calculated expiration:', {
        duration: duration,
        startedAt: now,
        expiresAt: expiresAt
    })

    // Cancel any existing active subscription to the same trainer
    const cancelledCount = await UserSubscription.update(
        { status: 'cancelled' },
        {
            where: {
                userId: user.id,
                trainerId: transaction.trainerId,
                status: 'active',
            }
        }
    )
    console.log('[activateSubscription] Cancelled existing subscriptions:', cancelledCount[0])

    // Create new subscription
    try {
        const subscription = await UserSubscription.create({
            userId: user.id,
            trainerId: transaction.trainerId,
            subscriptionPlanId: plan.id,
            duration: duration,
            startedAt: now,
            expiresAt: expiresAt,
            status: 'active',
            lastPaymentReference: transaction.txRef,
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
            data: {
                userId: user.id,
                trainerId: transaction.trainerId,
                subscriptionPlanId: plan.id,
                duration: duration
            }
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

module.exports = {
    activateSubscription,
    getUserSubscription,
    cancelSubscription,
    hasActiveSubscription,
    getSubscribedTrainerId,
    calculateExpirationDate
}

