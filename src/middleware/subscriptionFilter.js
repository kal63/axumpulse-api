'use strict'

const { getSubscribedTrainerId } = require('../services/subscriptionService')

/**
 * Middleware to filter content by subscribed trainer
 * Adds trainerId filter to request if user has active subscription
 */
async function subscriptionFilter(req, res, next) {
    try {
        const userId = req.user?.id

        if (!userId) {
            // No user, no filtering needed
            return next()
        }

        // Get user's subscribed trainer ID
        const trainerId = await getSubscribedTrainerId(userId)

        if (trainerId) {
            // User has active subscription, add trainer filter
            req.subscriptionFilter = {
                trainerId: trainerId
            }
        } else {
            // No subscription, show all public content
            req.subscriptionFilter = null
        }

        next()
    } catch (error) {
        console.error('Subscription filter error:', error)
        // On error, don't filter (show all content)
        req.subscriptionFilter = null
        next()
    }
}

module.exports = {
    subscriptionFilter
}

