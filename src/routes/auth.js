'use strict'

const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { ok, err } = require('../utils/errors')
const { User, UserProfile } = require('../models')
const { isValidEthiopianPhone, normalizeEthiopianPhone } = require('../utils/phone')
const { requireAuth } = require('../middleware/auth')

const webBridgeCodes = new Map()

function ensureAbsoluteUrl(url, fallback) {
    if (!url && fallback) return fallback
    if (!url) return ''
    const trimmed = String(url).trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}

function resolveFrontendBaseUrl() {
    const fallback = 'http://localhost:3001'
    const candidate =
        process.env.FRONTEND_URL ||
        process.env.WEBAPP_URL ||
        process.env.NEXT_PUBLIC_WEB_URL ||
        process.env.PAYMENT_RETURN_URL ||
        fallback
    return ensureAbsoluteUrl(candidate, fallback).replace(/\/$/, '')
}

function sanitizeNextPath(next) {
    const raw = String(next || '').trim()
    if (!raw) return '/user/subscription/change-package'
    if (raw.startsWith('/')) return raw
    // prevent open redirects
    return '/user/subscription/change-package'
}

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

// POST /auth/dev-login - Dev login without validation (for testing purposes only, checks env.NODE_ENV === 'development')
router.post('/dev_login', async (req, res) => {
    console.log('Dev login attempt with body:', req.body)

    if (process.env.ENABLE_DEV_LOGIN !== 'true'
    ) {
        console.warn('Attempted dev login in non-development environment')
        return err(res, { code: 'FORBIDDEN', message: 'Dev login is only allowed in development environment' }, 403)
    }

    try {
        const { role } = req.body || {}
        console.log('Dev login role:', role)
        if (!role) {
            return err(res, { code: 'BAD_REQUEST', message: 'role is required' }, 400)
        }

        const creds = {}

        if(role === 'admin') {
            creds['phone'] = process.env.DEV_ADMIN_PHONE
            creds['password'] = process.env.DEV_ADMIN_PASSWORD
        }else if(role === 'trainer') {
            creds['phone'] = process.env.DEV_TRAINER_PHONE
            creds['password'] = process.env.DEV_TRAINER_PASSWORD
        }else if(role === 'user') {
            creds['phone'] = process.env.DEV_USER_PHONE
            creds['password'] = process.env.DEV_USER_PASSWORD
        }else if(role === 'medical') {
            creds['phone'] = process.env.DEV_MEDICAL_PHONE
            creds['password'] = process.env.DEV_MEDICAL_PASSWORD
        }else {
            return err(res, { code: 'BAD_REQUEST', message: 'Invalid role. Must be one of: admin, trainer, user, medical' }, 400)
        }

        console.log('Dev login credentials:', creds)
        const { phone, password } = creds

        const user = await User.findOne({ where: { phone: phone } })
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

// POST /auth/web-bridge-link
// Returns a one-time URL for the web app to exchange into a JWT.
// Body: { next?: string }
router.post('/web-bridge-link', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const next = sanitizeNextPath(req.body?.next)
        const code = crypto.randomBytes(24).toString('hex')
        const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
        webBridgeCodes.set(code, { userId, expiresAt })

        const webBase = resolveFrontendBaseUrl()
        const url = `${webBase}/auth/bridge?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
        return ok(res, { url, expiresAt })
    } catch (e) {
        console.error('web-bridge-link failed:', e)
        return err(res, { code: 'INTERNAL_ERROR', message: 'Failed to create bridge link' }, 500)
    }
})

// POST /auth/exchange-bridge
// Body: { code: string }
router.post('/exchange-bridge', async (req, res) => {
    try {
        const code = String(req.body?.code || '')
        if (!code) return err(res, { code: 'BAD_REQUEST', message: 'code is required' }, 400)

        const record = webBridgeCodes.get(code)
        if (!record) return err(res, { code: 'INVALID_CODE', message: 'Invalid or expired code' }, 400)
        if (Date.now() > record.expiresAt) {
            webBridgeCodes.delete(code)
            return err(res, { code: 'EXPIRED_CODE', message: 'Invalid or expired code' }, 400)
        }

        const user = await User.findByPk(record.userId)
        if (!user) {
            webBridgeCodes.delete(code)
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404)
        }

        // One-time use
        webBridgeCodes.delete(code)

        const token = jwt.sign(
            { id: user.id, isAdmin: user.isAdmin, isTrainer: user.isTrainer },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        )

        return ok(res, { token })
    } catch (e) {
        console.error('exchange-bridge failed:', e)
        return err(res, { code: 'INTERNAL_ERROR', message: 'Failed to exchange bridge code' }, 500)
    }
})

module.exports = { router }


