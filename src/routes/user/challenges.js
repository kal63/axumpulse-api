'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { Challenge, Trainer, User, UserChallengeProgress } = require('../../models')
const { Op } = require('sequelize')
const { optionalAuth } = require('../../middleware/auth')

// Allow optional authentication so we can include `userProgress` when the
// client sends a token (needed for correct join/completed UI).
router.use(optionalAuth)

// GET /user/challenges - Get all approved, public challenges
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id
        const { status, category, difficulty, search } = req.query
        const pagination = getPagination(req.query)

        // Build where clause - only show approved and public challenges
        const whereClause = {
            status: 'approved',
            isPublic: true
        }

        // Filter by challenge status (active, upcoming, completed)
        if (status === 'active') {
            whereClause.startTime = { [Op.lte]: new Date() }
            whereClause.endDate = { [Op.gte]: new Date() }
        } else if (status === 'upcoming') {
            whereClause.startTime = { [Op.gt]: new Date() }
        } else if (status === 'ended') {
            whereClause.endDate = { [Op.lt]: new Date() }
        }

        // Apply other filters
        if (category) {
            whereClause.category = category
        }

        if (difficulty) {
            whereClause.difficulty = difficulty
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }

        const result = await executePaginatedQuery(Challenge, {
            where: whereClause,
            include: [
                {
                    model: Trainer,
                    as: 'trainer',
                    attributes: ['userId', 'bio', 'specialties', 'verified'],
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'profilePicture']
                        }
                    ]
                },
                // Include user's progress if authenticated
                ...(userId ? [{
                    model: UserChallengeProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false,
                    attributes: ['status', 'progress', 'joinedAt', 'completedAt', 'rank']
                }] : [])
            ],
            order: [['startTime', 'DESC']]
        }, pagination)

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// GET /user/challenges/categories - Get available challenge categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Challenge.findAll({
            attributes: ['type'],
            where: {
                status: 'approved',
                isPublic: true,
                type: { [Op.ne]: null }
            },
            group: ['type'],
            raw: true
        })

        const categoryList = categories.map(c => c.type).filter(Boolean)

        ok(res, { categories: categoryList })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/challenges/:id - Get single challenge details
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params

        const challenge = await Challenge.findOne({
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
                            attributes: ['id', 'name', 'profilePicture']
                        }
                    ]
                },
                // Include user's progress if authenticated
                ...(userId ? [{
                    model: UserChallengeProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false
                }] : [])
            ]
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Get leaderboard (top 10 participants)
        const leaderboard = await UserChallengeProgress.findAll({
            where: {
                challengeId: id,
                status: { [Op.in]: ['active', 'completed'] }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'profilePicture']
                }
            ],
            order: [['progress', 'DESC']],
            limit: 10,
            attributes: ['userId', 'progress', 'status', 'joinedAt', 'completedAt', 'rank']
        })

        // Get total participants count
        const participantCount = await UserChallengeProgress.count({
            where: {
                challengeId: id
            }
        })

        ok(res, {
            challenge,
            leaderboard,
            participantCount
        })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/challenges/:id/leaderboard - Get full leaderboard for a challenge
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params
        const { limit = 50 } = req.query

        // Check if challenge exists
        const challenge = await Challenge.findOne({
            where: {
                id,
                status: 'approved',
                isPublic: true
            }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Get leaderboard
        const leaderboard = await UserChallengeProgress.findAll({
            where: {
                challengeId: id,
                status: { [Op.in]: ['active', 'completed'] }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'profilePicture']
                }
            ],
            order: [['progress', 'DESC'], ['completedAt', 'ASC']],
            limit: parseInt(limit),
            attributes: ['userId', 'progress', 'status', 'joinedAt', 'completedAt', 'xpEarned']
        })

        // Add rank numbers
        const rankedLeaderboard = leaderboard.map((entry, index) => ({
            ...entry.toJSON(),
            rank: index + 1
        }))

        // Get user's rank if authenticated
        let userRank = null
        if (userId) {
            const userProgress = await UserChallengeProgress.findOne({
                where: { userId, challengeId: id }
            })

            if (userProgress) {
                const higherRanked = await UserChallengeProgress.count({
                    where: {
                        challengeId: id,
                        status: { [Op.in]: ['active', 'completed'] },
                        [Op.or]: [
                            { progress: { [Op.gt]: userProgress.progress } },
                            {
                                progress: userProgress.progress,
                                completedAt: { [Op.lt]: userProgress.completedAt || new Date() }
                            }
                        ]
                    }
                })
                userRank = higherRanked + 1
            }
        }

        // Get total participants count
        const totalParticipants = await UserChallengeProgress.count({
            where: {
                challengeId: id,
                status: { [Op.in]: ['active', 'completed'] }
            }
        })

        ok(res, {
            leaderboard: rankedLeaderboard,
            userRank,
            totalParticipants
        })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }

