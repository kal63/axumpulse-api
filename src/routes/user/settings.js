'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { User, UserProfile } = require('../../models')
const { requireAuth } = require('../../middleware')
const { mergeAiContextSharing } = require('../../utils/defaultAiContextSharing')

// All settings routes require authentication
router.use(requireAuth)

// GET /user/settings - Get all user settings
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id

        const [user, profile] = await Promise.all([
            User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'phone', 'dateOfBirth', 'gender', 'profilePicture']
            }),
            UserProfile.findOne({ where: { userId } })
        ])

        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        const settings = {
            account: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                profilePicture: user.profilePicture
            },
            preferences: {
                language: profile?.language || 'en',
                theme: profile?.preferences?.theme || 'light',
                units: profile?.preferences?.units || 'metric',
                timeFormat: profile?.preferences?.timeFormat || '12h',
                dateFormat: profile?.preferences?.dateFormat || 'MM/DD/YYYY',
                aiContextSharing: mergeAiContextSharing(profile?.preferences?.aiContextSharing)
            },
            notifications: profile ? profile.toJSON().notificationSettings : {
                email: {
                    challengeReminders: true,
                    achievementNotifications: true,
                    weeklyReports: true,
                    marketing: false
                },
                push: {
                    workoutReminders: true,
                    challengeUpdates: true,
                    achievementUnlocks: true
                },
                frequency: 'daily'
            },
            fitness: {
                goals: profile ? profile.toJSON().fitnessGoals : {
                    primary: 'general_fitness',
                    secondary: [],
                    targetWeight: null,
                    targetDate: null
                },
                healthMetrics: profile ? profile.toJSON().healthMetrics : {
                    height: null,
                    weight: null,
                    activityLevel: 'moderate'
                },
                workoutPreferences: profile?.preferences?.workout || {
                    duration: '30',
                    intensity: 'moderate',
                    equipment: []
                }
            }
        }

        ok(res, settings)
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/settings - Update all settings
router.put('/', async (req, res) => {
    try {
        const userId = req.user.id
        const { account, preferences, notifications, fitness } = req.body

        const user = await User.findByPk(userId)
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // Update account information
        if (account) {
            const allowedAccountFields = ['name', 'email', 'dateOfBirth', 'gender'] // Removed 'phone' from allowed fields
            const accountUpdates = {}

            allowedAccountFields.forEach(field => {
                if (account[field] !== undefined) {
                    accountUpdates[field] = account[field]
                }
            })

            if (Object.keys(accountUpdates).length > 0) {
                await User.update(accountUpdates, { where: { id: userId } })
            }
        }

        // Update profile settings
        const profileUpdates = {}

        if (preferences) {
            const existingProfile = await UserProfile.findOne({ where: { userId } })
            const prev = existingProfile?.preferences && typeof existingProfile.preferences === 'object'
                ? existingProfile.preferences
                : {}
            profileUpdates.language = preferences.language !== undefined ? preferences.language : existingProfile?.language
            profileUpdates.preferences = {
                theme: preferences.theme !== undefined ? preferences.theme : prev.theme,
                units: preferences.units !== undefined ? preferences.units : prev.units,
                timeFormat: preferences.timeFormat !== undefined ? preferences.timeFormat : prev.timeFormat,
                dateFormat: preferences.dateFormat !== undefined ? preferences.dateFormat : prev.dateFormat,
                workout: preferences.workout !== undefined ? preferences.workout : (prev.workout || {}),
                aiContextSharing: preferences.aiContextSharing !== undefined
                    ? mergeAiContextSharing({ ...prev.aiContextSharing, ...preferences.aiContextSharing })
                    : mergeAiContextSharing(prev.aiContextSharing)
            }
        }

        if (notifications) {
            profileUpdates.notificationSettings = notifications
        }

        if (fitness) {
            profileUpdates.fitnessGoals = fitness.goals
            profileUpdates.healthMetrics = fitness.healthMetrics

            if (fitness.workoutPreferences) {
                const p = await UserProfile.findOne({ where: { userId } })
                const prevPref = p?.preferences && typeof p.preferences === 'object' ? p.preferences : {}
                profileUpdates.preferences = {
                    ...(profileUpdates.preferences || prevPref),
                    theme: profileUpdates.preferences?.theme ?? prevPref.theme,
                    units: profileUpdates.preferences?.units ?? prevPref.units,
                    timeFormat: profileUpdates.preferences?.timeFormat ?? prevPref.timeFormat,
                    dateFormat: profileUpdates.preferences?.dateFormat ?? prevPref.dateFormat,
                    aiContextSharing: profileUpdates.preferences?.aiContextSharing ?? mergeAiContextSharing(prevPref.aiContextSharing),
                    workout: fitness.workoutPreferences
                }
            }
        }

        if (Object.keys(profileUpdates).length > 0) {
            await UserProfile.upsert({
                userId,
                ...profileUpdates
            })
        }

        ok(res, { message: 'Settings updated successfully' })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/settings/account - Get account information
router.get('/account', async (req, res) => {
    try {
        const userId = req.user.id

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'dateOfBirth', 'gender', 'profilePicture']
        })

        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        ok(res, {
            name: user.name,
            email: user.email,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            profilePicture: user.profilePicture
        })
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/settings/account - Update account information
router.put('/account', async (req, res) => {
    try {
        const userId = req.user.id
        const { name, email, dateOfBirth, gender } = req.body // Removed phone from destructuring

        const user = await User.findByPk(userId)
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        const updates = {}
        if (name !== undefined) updates.name = name
        if (email !== undefined) updates.email = email
        // Phone number updates are not allowed for security reasons
        if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth
        if (gender !== undefined) updates.gender = gender

        if (Object.keys(updates).length > 0) {
            await User.update(updates, { where: { id: userId } })
        }

        ok(res, { message: 'Account information updated successfully' })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/settings/preferences - Get app preferences
router.get('/preferences', async (req, res) => {
    try {
        const userId = req.user.id

        const profile = await UserProfile.findOne({ where: { userId } })

        const preferences = {
            language: profile?.language || 'en',
            theme: profile?.preferences?.theme || 'light',
            units: profile?.preferences?.units || 'metric',
            timeFormat: profile?.preferences?.timeFormat || '12h',
            dateFormat: profile?.preferences?.dateFormat || 'MM/DD/YYYY',
            workout: profile?.preferences?.workout || {
                duration: '30',
                intensity: 'moderate',
                equipment: []
            }
        }

        ok(res, preferences)
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/settings/preferences - Update app preferences
router.put('/preferences', async (req, res) => {
    try {
        const userId = req.user.id
        const { language, theme, units, timeFormat, dateFormat, workout } = req.body

        const updates = {
            language,
            preferences: {
                theme,
                units,
                timeFormat,
                dateFormat,
                workout: workout || {}
            }
        }

        await UserProfile.upsert({
            userId,
            ...updates
        })

        ok(res, { message: 'Preferences updated successfully' })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/settings/notifications - Get notification settings
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.id

        const profile = await UserProfile.findOne({ where: { userId } })

        const notifications = profile?.notificationSettings || {
            email: {
                challengeReminders: true,
                achievementNotifications: true,
                weeklyReports: true,
                marketing: false
            },
            push: {
                workoutReminders: true,
                challengeUpdates: true,
                achievementUnlocks: true
            },
            frequency: 'daily'
        }

        ok(res, notifications)
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/settings/notifications - Update notification settings
router.put('/notifications', async (req, res) => {
    try {
        const userId = req.user.id
        const notificationSettings = req.body

        await UserProfile.upsert({
            userId,
            notificationSettings
        })

        ok(res, { message: 'Notification settings updated successfully' })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/settings/fitness - Get fitness goals and health metrics
router.get('/fitness', async (req, res) => {
    try {
        const userId = req.user.id

        const profile = await UserProfile.findOne({ where: { userId } })

        const fitness = {
            goals: profile?.fitnessGoals || {
                primary: 'general_fitness',
                secondary: [],
                targetWeight: null,
                targetDate: null
            },
            healthMetrics: profile?.healthMetrics || {
                height: null,
                weight: null,
                activityLevel: 'moderate'
            },
            workoutPreferences: profile?.preferences?.workout || {
                duration: '30',
                intensity: 'moderate',
                equipment: []
            }
        }

        ok(res, fitness)
    } catch (error) {
        err(res, error)
    }
})

// PUT /user/settings/fitness - Update fitness goals and health metrics
router.put('/fitness', async (req, res) => {
    try {
        const userId = req.user.id
        const { goals, healthMetrics, workoutPreferences } = req.body

        const updates = {}

        if (goals) {
            updates.fitnessGoals = goals
        }

        if (healthMetrics) {
            updates.healthMetrics = healthMetrics
        }

        if (workoutPreferences) {
            const profile = await UserProfile.findOne({ where: { userId } })
            const currentPreferences = profile?.preferences || {}

            updates.preferences = {
                ...currentPreferences,
                workout: workoutPreferences
            }
        }

        await UserProfile.upsert({
            userId,
            ...updates
        })

        ok(res, { message: 'Fitness settings updated successfully' })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }
