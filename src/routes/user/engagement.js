'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { UserContentProgress, Content } = require('../../models')
const { requireAuth } = require('../../middleware')
const { Op } = require('sequelize')

// All engagement routes require authentication
router.use(requireAuth)

// POST /user/engagement/like - Like/unlike content
router.post('/like', async (req, res) => {
    try {
        const userId = req.user.id
        const { contentId } = req.body

        if (!contentId) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'contentId is required' }, 400)
        }

        // Check if content exists
        const content = await Content.findByPk(contentId)
        if (!content) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Find or create user progress
        let [progress, created] = await UserContentProgress.findOrCreate({
            where: { userId, contentId },
            defaults: {
                userId,
                contentId,
                liked: true
            }
        })

        if (!created) {
            // Toggle like
            progress.liked = !progress.liked
            await progress.save()
        }

        // Update content likes count
        if (progress.liked) {
            await content.increment('likes')
        } else {
            await content.decrement('likes')
        }

        ok(res, {
            liked: progress.liked,
            totalLikes: content.likes + (progress.liked ? 1 : -1)
        })
    } catch (error) {
        err(res, error)
    }
})

// POST /user/engagement/save - Save/unsave content
router.post('/save', async (req, res) => {
    try {
        const userId = req.user.id
        const { contentId } = req.body

        if (!contentId) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'contentId is required' }, 400)
        }

        // Check if content exists
        const content = await Content.findByPk(contentId)
        if (!content) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Find or create user progress
        let [progress, created] = await UserContentProgress.findOrCreate({
            where: { userId, contentId },
            defaults: {
                userId,
                contentId,
                saved: true
            }
        })

        if (!created) {
            // Toggle save
            progress.saved = !progress.saved
            await progress.save()
        }

        ok(res, {
            saved: progress.saved
        })
    } catch (error) {
        err(res, error)
    }
})

// POST /user/engagement/watch-progress - Update watch time for content
router.post('/watch-progress', async (req, res) => {
    try {
        const userId = req.user.id
        const { contentId, watchTime, completed } = req.body

        if (!contentId || watchTime === undefined) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'contentId and watchTime are required' }, 400)
        }

        // Check if content exists
        const content = await Content.findByPk(contentId)
        if (!content) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Find or create user progress
        let [progress, created] = await UserContentProgress.findOrCreate({
            where: { userId, contentId },
            defaults: {
                userId,
                contentId,
                watchTime: parseInt(watchTime),
                completed: completed || false
            }
        })

        if (!created) {
            // Update watch time (take the maximum to prevent going backwards)
            progress.watchTime = Math.max(progress.watchTime || 0, parseInt(watchTime))

            // Mark as completed if specified
            if (completed && !progress.completed) {
                progress.completed = true
                progress.completedAt = new Date()
                // Award XP for completing content (50 XP base)
                progress.xpEarned = 50

                // Update content views
                await content.increment('views')
            }

            await progress.save()
        }

        ok(res, {
            watchTime: progress.watchTime,
            completed: progress.completed,
            xpEarned: progress.xpEarned
        })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/engagement/saved - Get user's saved content
router.get('/saved', async (req, res) => {
    try {
        const userId = req.user.id

        const savedContent = await UserContentProgress.findAll({
            where: {
                userId,
                saved: true
            },
            include: [
                {
                    model: Content,
                    as: 'content',
                    where: {
                        status: 'approved',
                        isPublic: true
                    },
                    attributes: ['id', 'title', 'description', 'thumbnailUrl', 'duration', 'difficulty', 'category', 'views', 'likes']
                }
            ],
            order: [['updatedAt', 'DESC']]
        })

        ok(res, { items: savedContent })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/engagement/history - Get user's watch history
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id

        const history = await UserContentProgress.findAll({
            where: {
                userId,
                watchTime: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: Content,
                    as: 'content',
                    where: {
                        status: 'approved',
                        isPublic: true
                    },
                    attributes: ['id', 'title', 'description', 'thumbnailUrl', 'duration', 'difficulty', 'category', 'views', 'likes']
                }
            ],
            order: [['updatedAt', 'DESC']],
            limit: 50
        })

        ok(res, { items: history })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }
