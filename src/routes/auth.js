'use strict'

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { ok, err } = require('../utils/errors')
const { User, UserProfile } = require('../models')
const { isValidEthiopianPhone, normalizeEthiopianPhone } = require('../utils/phone')
const { requireAuth } = require('../middleware/auth')

// POST /auth/login { phone, password }
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body || {}
        if (!phone || !password) {
            return err(res, { code: 'BAD_REQUEST', message: 'phone and password are required' }, 400)
        }

        // Validate and normalize Ethiopian phone number
        if (!isValidEthiopianPhone(phone)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Phone number must be a valid Ethiopian phone number (+251XXXXXXXXX)' }, 400)
        }

        const normalizedPhone = normalizeEthiopianPhone(phone)
        const user = await User.findOne({ where: { phone: normalizedPhone } })
        if (!user || !user.passwordHash) {
            return err(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' }, 401)
        }

        const okPw = await bcrypt.compare(password, user.passwordHash)
        if (!okPw) {
            return err(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' }, 401)
        }

        const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin, isTrainer: user.isTrainer }, process.env.JWT_SECRET, { expiresIn: '365d' })
        user.lastLoginAt = new Date()
        await user.save()

        return ok(res, {
            token,
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                isAdmin: user.isAdmin,
                isTrainer: user.isTrainer,
                status: user.status,
                lastLoginAt: user.lastLoginAt,
                lastActiveAt: user.lastActiveAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        })
    } catch (e) {
        return err(res, { code: 'LOGIN_FAILED', message: 'Failed to login' }, 500)
    }
})

// POST /auth/register - Register new user
router.post('/register', async (req, res) => {
    try {
        const { phone, email, password, name, dateOfBirth, gender } = req.body || {}

        if (!phone || !password) {
            return err(res, { code: 'BAD_REQUEST', message: 'phone and password are required' }, 400)
        }

        // Validate and normalize Ethiopian phone number
        if (!isValidEthiopianPhone(phone)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Phone number must be a valid Ethiopian phone number (+251XXXXXXXXX)' }, 400)
        }

        const normalizedPhone = normalizeEthiopianPhone(phone)

        // Check if user already exists
        const existingUser = await User.findOne({ where: { phone: normalizedPhone } })
        if (existingUser) {
            return err(res, { code: 'USER_EXISTS', message: 'User with this phone number already exists' }, 400)
        }

        // Check email uniqueness if provided
        if (email) {
            const existingEmail = await User.findOne({ where: { email } })
            if (existingEmail) {
                return err(res, { code: 'EMAIL_EXISTS', message: 'User with this email already exists' }, 400)
            }
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10)

        // Create user
        const user = await User.create({
            phone: normalizedPhone,
            email: email || null,
            passwordHash,
            name: name || null,
            dateOfBirth: dateOfBirth || null,
            gender: gender || null,
            isAdmin: false,
            isTrainer: false,
            isMedical: false,
            status: 'active'
        })

        // Create user profile
        await UserProfile.create({
            userId: user.id,
            totalXp: 0,
            challengesCompleted: 0,
            workoutsCompleted: 0,
            dailyChallengeStreak: 0,
            subscriptionTier: 'premium',
            language: 'en',
            notificationSettings: {},
            fitnessGoals: {},
            healthMetrics: {},
            preferences: {}
        })

        // Generate token
        const token = jwt.sign({ id: user.id, isAdmin: user.isAdmin, isTrainer: user.isTrainer }, process.env.JWT_SECRET, { expiresIn: '365d' })

        return ok(res, {
            token,
            user: {
                id: user.id,
                phone: user.phone,
                email: user.email,
                name: user.name,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                isAdmin: user.isAdmin,
                isTrainer: user.isTrainer,
                status: user.status,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        })
    } catch (error) {
        console.error('Registration error:', error)
        return err(res, { code: 'REGISTRATION_FAILED', message: 'Failed to register user', error: error.message }, 500)
    }
})

// GET /auth/me - Get current user's full profile
router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.id
        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: UserProfile,
                    as: 'profile',
                    required: false // LEFT JOIN - include user even without profile
                }
            ]
        })

        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        return ok(res, { user })
    } catch (error) {
        return err(res, { code: 'FETCH_FAILED', message: 'Failed to fetch user data' }, 500)
    }
})

module.exports = { router }


