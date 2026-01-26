'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { Content, Trainer, User, UserContentProgress } = require('../../models')
const { Op } = require('sequelize')
const { getSubscribedTrainerId } = require('../../services/subscriptionService')

// GET /user/content - Get all approved, public content for users
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id
        const { type, category, difficulty, language, duration, search } = req.query
        const pagination = getPagination(req.query)

        // Build where clause - only show approved and public content
        const whereClause = {
            status: 'approved',
            isPublic: true
        }

        // Apply filters
        if (type && type !== 'all') {
            whereClause.type = type
        }

        if (category) {
            whereClause.category = category
        }

        if (difficulty) {
            whereClause.difficulty = difficulty
        }

        if (language) {
            whereClause.language = language
        }

        if (duration) {
            // Duration filter: short (<15min), medium (15-30min), long (>30min)
            switch (duration) {
                case 'short':
                    whereClause.duration = { [Op.lt]: 15 }
                    break
                case 'medium':
                    whereClause.duration = { [Op.between]: [15, 30] }
                    break
                case 'long':
                    whereClause.duration = { [Op.gt]: 30 }
                    break
            }
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }

        // Filter by subscribed trainer if user has active subscription
        if (userId) {
            try {
                const subscribedTrainerId = await getSubscribedTrainerId(userId)
                if (subscribedTrainerId) {
                    whereClause.trainerId = subscribedTrainerId
                }
            } catch (error) {
                console.error('Error checking subscription:', error)
                // Continue without filtering on error
            }
        }

        const result = await executePaginatedQuery(Content, {
            where: whereClause,
            include: [
                {
                    model: Trainer,
                    as: 'trainer',
                    attributes: ['userId', 'bio', 'specialties', 'verified'],
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'email', 'profilePicture']
                        }
                    ]
                },
                // Include user's progress if authenticated
                ...(userId ? [{
                    model: UserContentProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false,
                    attributes: ['completed', 'watchTime', 'liked', 'saved', 'xpEarned']
                }] : [])
            ],
            order: [['createdAt', 'DESC']]
        }, pagination)

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// GET /user/content/categories - Get available content categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Content.findAll({
            attributes: ['category'],
            where: {
                status: 'approved',
                isPublic: true,
                category: { [Op.ne]: null }
            },
            group: ['category'],
            raw: true
        })

        const categoryList = categories.map(c => c.category).filter(Boolean)

        ok(res, { categories: categoryList })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/content/:id - Get single content item
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params

        const content = await Content.findOne({
            where: {
                id,
                status: 'approved',
                isPublic: true
            },
            include: [
                {
                    model: Trainer,
                    as: 'trainer',
                    attributes: ['userId', 'bio', 'specialties', 'verified'],
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'email', 'profilePicture']
                        }
                    ]
                },
                // Include user's progress if authenticated
                ...(userId ? [{
                    model: UserContentProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false
                }] : [])
            ]
        })

        if (!content) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Get related content (same category or tags)
        const relatedContent = await Content.findAll({
            where: {
                id: { [Op.ne]: id },
                status: 'approved',
                isPublic: true,
                [Op.or]: [
                    { category: content.category },
                    ...(content.tags && content.tags.length > 0 ? [{
                        tags: { [Op.overlap]: content.tags }
                    }] : [])
                ]
            },
            limit: 6,
            attributes: ['id', 'title', 'thumbnailUrl', 'duration', 'difficulty', 'views', 'likes'],
            include: [
                {
                    model: Trainer,
                    as: 'trainer',
                    attributes: ['userId'],
                    include: [
                        {
                            model: User,
                            attributes: ['name', 'profilePicture']
                        }
                    ]
                }
            ]
        })

        // Include user progress for related content if authenticated
        const relatedWithProgress = userId ? await Promise.all(relatedContent.map(async (item) => {
            const progress = await UserContentProgress.findOne({
                where: { userId, contentId: item.id },
                attributes: ['completed']
            })
            return {
                ...item.toJSON(),
                userProgress: progress
            }
        })) : relatedContent

        ok(res, {
            content,
            relatedContent: relatedWithProgress
        })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }

