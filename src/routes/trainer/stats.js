'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { Challenge, Content, WorkoutPlan, User, UserProfile } = require('../../models')
const { Op } = require('sequelize')

// GET /trainer/analytics - Comprehensive analytics dashboard
router.get('/analytics', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const { period = '30d' } = req.query // 7d, 30d, 90d, 1y

        // Calculate date range based on period
        const now = new Date()
        let startDate
        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                break
            case '90d':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                break
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        // Basic counts
        const [
            totalContent,
            totalWorkoutPlans,
            totalChallenges,
            approvedContent,
            activeChallenges
        ] = await Promise.all([
            Content.count({ where: { trainerId } }),
            WorkoutPlan.count({ where: { trainerId } }),
            Challenge.count({ where: { trainerId } }),
            Content.count({ where: { trainerId, status: 'approved' } }),
            Challenge.count({ where: { trainerId, status: 'active' } })
        ])

        // Content analytics
        const contentStats = await Content.findAll({
            where: { trainerId },
            attributes: [
                'type',
                'status',
                [Content.sequelize.fn('SUM', Content.sequelize.col('views')), 'totalViews'],
                [Content.sequelize.fn('SUM', Content.sequelize.col('likes')), 'totalLikes'],
                [Content.sequelize.fn('COUNT', Content.sequelize.col('id')), 'count']
            ],
            group: ['type', 'status'],
            raw: true
        })

        // Recent content performance (last 30 days)
        const recentContent = await Content.findAll({
            where: {
                trainerId,
                createdAt: { [Op.gte]: startDate }
            },
            attributes: [
                'id',
                'title',
                'type',
                'views',
                'likes',
                'createdAt'
            ],
            order: [['views', 'DESC']],
            limit: 10
        })

        // Workout plan analytics
        const workoutPlanStats = await WorkoutPlan.findAll({
            where: { trainerId },
            attributes: [
                'difficulty',
                'status',
                [WorkoutPlan.sequelize.fn('COUNT', WorkoutPlan.sequelize.col('id')), 'count']
            ],
            group: ['difficulty', 'status'],
            raw: true
        })

        // Challenge analytics
        const challengeStats = await Challenge.findAll({
            where: { trainerId },
            attributes: [
                'type',
                'difficulty',
                'status',
                [Challenge.sequelize.fn('SUM', Challenge.sequelize.col('participantCount')), 'totalParticipants'],
                [Challenge.sequelize.fn('SUM', Challenge.sequelize.col('completionCount')), 'totalCompletions'],
                [Challenge.sequelize.fn('COUNT', Challenge.sequelize.col('id')), 'count']
            ],
            group: ['type', 'difficulty', 'status'],
            raw: true
        })

        // Calculate engagement metrics
        const totalViews = contentStats.reduce((sum, stat) => sum + (parseInt(stat.totalViews) || 0), 0)
        const totalLikes = contentStats.reduce((sum, stat) => sum + (parseInt(stat.totalLikes) || 0), 0)
        const totalParticipants = challengeStats.reduce((sum, stat) => sum + (parseInt(stat.totalParticipants) || 0), 0)
        const totalCompletions = challengeStats.reduce((sum, stat) => sum + (parseInt(stat.totalCompletions) || 0), 0)

        // Calculate completion rate
        const completionRate = totalParticipants > 0 ? (totalCompletions / totalParticipants * 100).toFixed(1) : 0

        // Growth metrics (comparing with previous period)
        const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))

        const [
            previousContentCount,
            previousWorkoutPlansCount,
            previousChallengesCount
        ] = await Promise.all([
            Content.count({
                where: {
                    trainerId,
                    createdAt: { [Op.between]: [previousStartDate, startDate] }
                }
            }),
            WorkoutPlan.count({
                where: {
                    trainerId,
                    createdAt: { [Op.between]: [previousStartDate, startDate] }
                }
            }),
            Challenge.count({
                where: {
                    trainerId,
                    createdAt: { [Op.between]: [previousStartDate, startDate] }
                }
            })
        ])

        const currentContentCount = await Content.count({
            where: {
                trainerId,
                createdAt: { [Op.gte]: startDate }
            }
        })

        const currentWorkoutPlansCount = await WorkoutPlan.count({
            where: {
                trainerId,
                createdAt: { [Op.gte]: startDate }
            }
        })

        const currentChallengesCount = await Challenge.count({
            where: {
                trainerId,
                createdAt: { [Op.gte]: startDate }
            }
        })

        // Calculate growth percentages
        const contentGrowth = previousContentCount > 0 ?
            ((currentContentCount - previousContentCount) / previousContentCount * 100).toFixed(1) : 0
        const workoutPlansGrowth = previousWorkoutPlansCount > 0 ?
            ((currentWorkoutPlansCount - previousWorkoutPlansCount) / previousWorkoutPlansCount * 100).toFixed(1) : 0
        const challengesGrowth = previousChallengesCount > 0 ?
            ((currentChallengesCount - previousChallengesCount) / previousChallengesCount * 100).toFixed(1) : 0

        // Top performing content
        const topContent = await Content.findAll({
            where: { trainerId },
            attributes: ['id', 'title', 'type', 'views', 'likes', 'createdAt'],
            order: [['views', 'DESC']],
            limit: 5
        })

        // Status distribution
        const contentStatusDistribution = await Content.findAll({
            where: { trainerId },
            attributes: [
                'status',
                [Content.sequelize.fn('COUNT', Content.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        })

        const challengeStatusDistribution = await Challenge.findAll({
            where: { trainerId },
            attributes: [
                'status',
                [Challenge.sequelize.fn('COUNT', Challenge.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        })

        const analytics = {
            overview: {
                totalContent,
                totalWorkoutPlans,
                totalChallenges,
                approvedContent,
                activeChallenges,
                totalViews,
                totalLikes,
                totalParticipants,
                totalCompletions,
                completionRate: parseFloat(completionRate)
            },
            growth: {
                content: {
                    current: currentContentCount,
                    previous: previousContentCount,
                    growth: parseFloat(contentGrowth)
                },
                workoutPlans: {
                    current: currentWorkoutPlansCount,
                    previous: previousWorkoutPlansCount,
                    growth: parseFloat(workoutPlansGrowth)
                },
                challenges: {
                    current: currentChallengesCount,
                    previous: previousChallengesCount,
                    growth: parseFloat(challengesGrowth)
                }
            },
            contentAnalytics: {
                byType: contentStats.filter(stat => stat.type),
                byStatus: contentStatusDistribution,
                topPerforming: topContent,
                recent: recentContent
            },
            workoutPlanAnalytics: {
                byDifficulty: workoutPlanStats.filter(stat => stat.difficulty),
                byStatus: workoutPlanStats.filter(stat => stat.status)
            },
            challengeAnalytics: {
                byType: challengeStats.filter(stat => stat.type),
                byDifficulty: challengeStats.filter(stat => stat.difficulty),
                byStatus: challengeStatusDistribution
            },
            period,
            generatedAt: new Date().toISOString()
        }

        ok(res, analytics)
    } catch (error) {
        err(res, error)
    }
})

// GET /trainer/stats - Legacy endpoint for backward compatibility
router.get('/stats', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const [contentCount, activeChallenges] = await Promise.all([
            Content.count({ where: { trainerId } }),
            Challenge.count({ where: { trainerId, status: 'active' } })
        ])
        ok(res, { contentCount, activeChallenges })
    } catch (error) {
        err(res, error)
    }
})

module.exports = router






