'use strict'

const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const {
    User,
    UserProfile,
    Achievement,
    UserAchievement,
    UserContentProgress,
    UserWorkoutPlanProgress,
    UserChallengeProgress
} = require('../../models')
const { requireAuth } = require('../../middleware')

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads/profiles')
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id
        const timestamp = Date.now()
        const extension = path.extname(file.originalname)
        cb(null, `profile_${userId}_${timestamp}${extension}`)
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)

        if (mimetype && extname) {
            return cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'))
        }
    }
})

// All profile routes require authentication
router.use(requireAuth)

// GET /user/profile - Get user's full profile
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id

        const user = await User.findByPk(userId, {
            attributes: [
                'id', 'name', 'email', 'profilePicture',
                'createdAt'
            ],
            include: [{
                model: UserProfile,
                as: 'profile',
                attributes: ['totalXp', 'challengesCompleted', 'workoutsCompleted']
            }]
        })

        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // Get XP data from profile
        const xp = user.profile?.totalXp || 0
        const level = Math.floor(xp / 100) + 1 // Simple level calculation: 100 XP per level

        // Calculate XP progress
        const currentLevelXP = (level - 1) * 100
        const nextLevelXP = level * 100
        const xpProgress = xp - currentLevelXP
        const xpNeeded = nextLevelXP - currentLevelXP

        // Get quick stats
        const stats = {
            contentWatched: await UserContentProgress.count({
                where: { userId, completed: true }
            }),
            workoutPlansCompleted: await UserWorkoutPlanProgress.count({
                where: { userId, status: 'completed' }
            }),
            challengesCompleted: await UserChallengeProgress.count({
                where: { userId, status: 'completed' }
            }),
            achievementsUnlocked: await UserAchievement.count({
                where: { userId }
            })
        }

        ok(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                xp: xp,
                level: level,
                xpProgress,
                xpNeeded,
                levelProgress: Math.round((xpProgress / xpNeeded) * 100),
                createdAt: user.createdAt
            },
            stats
        })
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/profile - Update user profile
router.put('/', async (req, res) => {
    try {
        const userId = req.user.id
        const { name, bio, location, profilePicture } = req.body

        const user = await User.findByPk(userId)
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // Update allowed fields
        if (name !== undefined) user.name = name
        if (bio !== undefined) user.bio = bio
        if (location !== undefined) user.location = location
        if (profilePicture !== undefined) user.profilePicture = profilePicture

        await user.save()

        ok(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                bio: user.bio,
                location: user.location,
                xp: user.xp,
                level: user.level
            }
        })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/profile/stats - Get user's stats and progress
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id

        // Get user data
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'profilePicture', 'createdAt'],
            include: [{
                model: UserProfile,
                as: 'profile',
                attributes: ['totalXp', 'challengesCompleted', 'workoutsCompleted']
            }]
        })

        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // Get XP data from profile
        const xp = user.profile?.totalXp || 0
        const level = Math.floor(xp / 100) + 1 // Simple level calculation: 100 XP per level

        // Calculate XP progress to next level
        const currentLevelXP = (level - 1) * 100
        const nextLevelXP = level * 100
        const xpProgress = xp - currentLevelXP
        const xpNeeded = nextLevelXP - currentLevelXP

        // Get stats - use values from user_profile table for workoutsCompleted and challengesCompleted
        const stats = {
            // Content stats
            contentWatched: await UserContentProgress.count({
                where: { userId, completed: true }
            }),
            contentSaved: await UserContentProgress.count({
                where: { userId, saved: true }
            }),
            totalWatchTime: await UserContentProgress.sum('watchTime', {
                where: { userId }
            }) || 0,

            // Workout stats
            workoutPlansStarted: await UserWorkoutPlanProgress.count({
                where: { userId }
            }),
            // Compute from progress rows (don't rely on cached counter),
            // so completed plans are always reflected.
            workoutPlansCompleted: await UserWorkoutPlanProgress.count({
                where: { userId, status: 'completed' }
            }),

            // Challenge stats
            challengesJoined: await UserChallengeProgress.count({
                where: { userId }
            }),
            // Compute from progress rows (don't rely on cached counter)
            challengesCompleted: await UserChallengeProgress.count({
                where: { userId, status: 'completed' }
            }),

            // Achievement stats
            achievementsUnlocked: await UserAchievement.count({
                where: { userId }
            })
        }

        ok(res, {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                xp: xp,
                level: level,
                xpProgress,
                xpNeeded,
                memberSince: user.createdAt
            },
            stats
        })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/profile/history - Get user's XP history
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id
        const { period = '30' } = req.query // days

        const daysAgo = parseInt(period)
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysAgo)

        // Get content completion XP
        const contentXP = await UserContentProgress.findAll({
            where: {
                userId,
                completed: true,
                completedAt: { [require('sequelize').Op.gte]: startDate }
            },
            attributes: ['completedAt', 'xpEarned'],
            order: [['completedAt', 'ASC']]
        })

        // Get challenge completion XP
        const challengeXP = await UserChallengeProgress.findAll({
            where: {
                userId,
                status: 'completed',
                completedAt: { [require('sequelize').Op.gte]: startDate }
            },
            attributes: ['completedAt', 'xpEarned'],
            order: [['completedAt', 'ASC']]
        })

        // Get workout plan completion XP (we'll need to add xpEarned to this model)
        const workoutXP = await UserWorkoutPlanProgress.findAll({
            where: {
                userId,
                status: 'completed',
                completedAt: { [require('sequelize').Op.gte]: startDate }
            },
            attributes: ['completedAt', 'xpEarned'],
            order: [['completedAt', 'ASC']]
        })

        // Combine and format history
        const history = [
            ...contentXP.map(item => ({
                date: item.completedAt,
                xp: item.xpEarned || 0,
                type: 'content'
            })),
            ...challengeXP.map(item => ({
                date: item.completedAt,
                xp: item.xpEarned || 0,
                type: 'challenge'
            })),
            ...workoutXP.map(item => ({
                date: item.completedAt,
                xp: item.xpEarned || 0,
                type: 'workout'
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date))

        // Aggregate by day
        const dailyXP = {}
        history.forEach(item => {
            const dateKey = new Date(item.date).toISOString().split('T')[0]
            if (!dailyXP[dateKey]) {
                dailyXP[dateKey] = { date: dateKey, xp: 0, breakdown: { content: 0, challenge: 0, workout: 0 } }
            }
            dailyXP[dateKey].xp += item.xp
            dailyXP[dateKey].breakdown[item.type] += item.xp
        })

        const chartData = Object.values(dailyXP).sort((a, b) => new Date(a.date) - new Date(b.date))

        // Calculate cumulative XP
        let cumulativeXP = 0
        const cumulativeData = chartData.map(day => {
            cumulativeXP += day.xp
            return {
                ...day,
                cumulativeXP
            }
        })

        // Calculate summary stats
        const totalXP = history.reduce((sum, item) => sum + item.xp, 0)
        const avgDailyXP = chartData.length > 0 ? totalXP / daysAgo : 0

        ok(res, {
            history: cumulativeData,
            summary: {
                totalXP,
                avgDailyXP: Math.round(avgDailyXP),
                period: daysAgo,
                entries: history.length
            }
        })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/profile/achievements - Get user's achievements
router.get('/achievements', async (req, res) => {
    try {
        const userId = req.user.id

        // Get unlocked achievements
        const unlocked = await UserAchievement.findAll({
            where: { userId },
            include: [{
                model: Achievement,
                as: 'achievement'
            }],
            order: [['unlockedAt', 'DESC']]
        })

        // Get all achievements
        const allAchievements = await Achievement.findAll({
            order: [['rarity', 'ASC'], ['xpReward', 'ASC']]
        })

        // Map unlocked achievement IDs
        const unlockedIds = unlocked.map(ua => ua.achievementId)

        // Separate unlocked and locked achievements
        const achievements = allAchievements.map(achievement => ({
            ...achievement.toJSON(),
            unlocked: unlockedIds.includes(achievement.id),
            unlockedAt: unlocked.find(ua => ua.achievementId === achievement.id)?.unlockedAt || null
        }))

        ok(res, {
            achievements,
            totalUnlocked: unlocked.length,
            totalAchievements: allAchievements.length
        })
    } catch (error) {
        err(res, error)
    }
})

// POST /user/profile/add-xp - Add XP to user (internal use, can be called by other services)
router.post('/add-xp', async (req, res) => {
    try {
        const userId = req.user.id
        const { xp, reason } = req.body

        if (!xp || xp <= 0) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Valid XP amount is required' }, 400)
        }

        const user = await User.findByPk(userId)
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // Add XP
        user.xp += parseInt(xp)

        // Check for level up
        const newLevel = calculateLevel(user.xp)
        const leveledUp = newLevel > user.level

        if (leveledUp) {
            user.level = newLevel
        }

        await user.save()

        ok(res, {
            xp: user.xp,
            level: user.level,
            xpAdded: parseInt(xp),
            leveledUp,
            reason: reason || 'XP awarded'
        })
    } catch (error) {
        err(res, error)
    }
})

// Helper function to calculate level from XP
function calculateLevel(xp) {
    // Level formula: Level = floor(sqrt(XP / 100))
    // This means:
    // Level 1: 0 XP
    // Level 2: 100 XP
    // Level 3: 400 XP
    // Level 4: 900 XP
    // Level 5: 1600 XP
    // etc.
    return Math.floor(Math.sqrt(xp / 100)) + 1
}

// Helper function to get XP required for a specific level
function getLevelXP(level) {
    // Inverse of level formula
    return Math.pow(level - 1, 2) * 100
}

// POST /user/profile/profile-image - Upload profile image
router.post('/profile-image', upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.user.id

        if (!req.file) {
            return err(res, { code: 'NO_FILE', message: 'No profile image file provided' }, 400)
        }

        // Delete old profile image if it exists
        const user = await User.findByPk(userId, { attributes: ['profilePicture'] })
        if (user?.profilePicture) {
            const oldImagePath = path.join(__dirname, '../../uploads', user.profilePicture.replace('/api/v1/uploads/', ''))
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath)
            }
        }

        // Update user with new profile image path
        const imagePath = `/api/v1/uploads/profiles/${req.file.filename}`
        await User.update(
            { profilePicture: imagePath },
            { where: { id: userId } }
        )

        ok(res, {
            message: 'Profile image updated successfully',
            profilePicture: imagePath
        })
    } catch (error) {
        // Clean up uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        }
        err(res, error)
    }
})

// DELETE /user/profile/profile-image - Remove profile image
router.delete('/profile-image', async (req, res) => {
    try {
        const userId = req.user.id

        const user = await User.findByPk(userId, { attributes: ['profilePicture'] })
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        if (user.profilePicture) {
            // Delete the file from filesystem
            const imagePath = path.join(__dirname, '../../uploads', user.profilePicture.replace('/api/v1/uploads/', ''))
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath)
            }

            // Update user to remove profile picture
            await User.update(
                { profilePicture: null },
                { where: { id: userId } }
            )
        }

        ok(res, {
            message: 'Profile image removed successfully'
        })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }

