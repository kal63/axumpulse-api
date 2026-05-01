'use strict'

const express = require('express')
const { Transaction } = require('sequelize')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { ok, err } = require('../utils/errors')
const { sequelize, User, UserProfile, TelcoPendingRegistration } = require('../models')
const { isValidEthiopianPhone, normalizeEthiopianPhone } = require('../utils/phone')
const { requireAuth } = require('../middleware/auth')
const { createActiveSubscriptionForUser } = require('../services/subscriptionService')

const webBridgeCodes = new Map()

function ensureAbsoluteUrl(url, fallback) {
    if (!url && fallback) return fallback
    if (!url) return ''
    const trimmed = String(url).trim()
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}

function resolveFrontendBaseUrl(req, overrideUrl) {
    const fallback = 'http://localhost:3001'
    const explicit =
        overrideUrl ||
        process.env.FRONTEND_URL ||
        process.env.WEBAPP_URL ||
        process.env.NEXT_PUBLIC_WEB_URL ||
        process.env.PAYMENT_RETURN_URL
    if (explicit && String(explicit).trim()) {
        return ensureAbsoluteUrl(String(explicit).trim(), fallback).replace(/\/$/, '')
    }
    const host = req?.get?.('host') || req?.headers?.host || ''
    const xfProto = String(req?.get?.('x-forwarded-proto') || req?.headers?.['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim()
    const proto = xfProto === 'https' || xfProto === 'http' ? xfProto : req?.secure ? 'https' : 'http'
    if (host) return `${proto}://${host}`.replace(/\/$/, '')
    return fallback
}

function resolveApiBaseUrl(req, overrideUrl) {
    const fallback = 'http://localhost:3000/api/v1'
    const explicit =
        overrideUrl ||
        process.env.API_PUBLIC_URL ||
        process.env.PUBLIC_BACKEND_URL ||
        process.env.API_BASE_URL ||
        process.env.BACKEND_URL
    if (explicit && String(explicit).trim()) {
        const u = ensureAbsoluteUrl(String(explicit).trim(), fallback).replace(/\/$/, '')
        return u.endsWith('/api/v1') ? u : `${u}/api/v1`
    }
    const host = req?.get?.('host') || req?.headers?.host || ''
    const xfProto = String(req?.get?.('x-forwarded-proto') || req?.headers?.['x-forwarded-proto'] || '')
        .split(',')[0]
        .trim()
    const proto = xfProto === 'https' || xfProto === 'http' ? xfProto : req?.secure ? 'https' : 'http'
    if (host) return `${proto}://${host}/api/v1`.replace(/\/$/, '')
    return fallback
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

        if (!user) {
            const pending = await TelcoPendingRegistration.findOne({
                where: { phone: normalizedPhone, consumedAt: null },
            })
            if (pending && (await bcrypt.compare(password, pending.passwordHash))) {
                return ok(res, {
                    telcoRegistrationPending: true,
                    phone: normalizedPhone,
                })
            }
            return err(res, { code: 'INVALID_CREDENTIALS', message: 'Invalid phone or password' }, 401)
        }

        if (!user.passwordHash) {
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

// POST /auth/register-telco — complete app account after Ethiotell short-code purchase (pending row)
router.post('/register-telco', async (req, res) => {
    try {
        const {
            phone,
            password,
            telcoPassword,
            email,
            name,
            dateOfBirth,
            gender,
        } = req.body || {}

        if (!phone || !password || !telcoPassword) {
            return err(res, { code: 'BAD_REQUEST', message: 'phone, password, and telcoPassword are required' }, 400)
        }

        if (!isValidEthiopianPhone(phone)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Phone number must be a valid Ethiopian phone number (+251XXXXXXXXX)' }, 400)
        }

        const normalizedPhone = normalizeEthiopianPhone(phone)

        const existingUser = await User.findOne({ where: { phone: normalizedPhone } })
        if (existingUser) {
            return err(res, { code: 'USER_EXISTS', message: 'User with this phone number already exists' }, 400)
        }

        if (email) {
            const existingEmail = await User.findOne({ where: { email } })
            if (existingEmail) {
                return err(res, { code: 'EMAIL_EXISTS', message: 'User with this email already exists' }, 400)
            }
        }

        const passwordHash = await bcrypt.hash(password, 10)

        let result
        try {
            result = await sequelize.transaction(async (t) => {
                const lockedPending = await TelcoPendingRegistration.findOne({
                    where: { phone: normalizedPhone, consumedAt: null },
                    lock: Transaction.LOCK.UPDATE,
                    transaction: t,
                })
                if (!lockedPending) {
                    const e = new Error('No pending Ethiotell registration for this phone')
                    e.code = 'NO_PENDING_TELCO'
                    throw e
                }

                const telcoOk = await bcrypt.compare(String(telcoPassword), lockedPending.passwordHash)
                if (!telcoOk) {
                    const e = new Error('Ethiotell password does not match')
                    e.code = 'INVALID_TELCO_PASSWORD'
                    throw e
                }

                const dupUser = await User.findOne({
                    where: { phone: normalizedPhone },
                    transaction: t,
                    lock: Transaction.LOCK.UPDATE,
                })
                if (dupUser) {
                    const e = new Error('User with this phone number already exists')
                    e.code = 'USER_EXISTS'
                    throw e
                }

                const user = await User.create(
                    {
                        phone: normalizedPhone,
                        email: email || null,
                        passwordHash,
                        name: name || null,
                        dateOfBirth: dateOfBirth || null,
                        gender: gender || null,
                        isAdmin: false,
                        isTrainer: false,
                        isMedical: false,
                        status: 'active',
                    },
                    { transaction: t }
                )

                await UserProfile.create(
                    {
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
                        preferences: {},
                    },
                    { transaction: t }
                )

                let trainerIdForSub = lockedPending.trainerId
                if (!trainerIdForSub) {
                    const fallbackTrainer = await User.findOne({
                        where: { isTrainer: true },
                        order: [['id', 'ASC']],
                        transaction: t,
                    })
                    if (!fallbackTrainer) {
                        const e = new Error('No trainer available to attach subscription')
                        e.code = 'NO_TRAINER_FOR_TELCO'
                        throw e
                    }
                    trainerIdForSub = fallbackTrainer.id
                }

                await createActiveSubscriptionForUser({
                    userId: user.id,
                    trainerId: trainerIdForSub,
                    subscriptionPlanId: lockedPending.subscriptionPlanId,
                    duration: lockedPending.duration,
                    lastPaymentReference: `ETHIOTELL-${lockedPending.id}-${Date.now()}`,
                    startedAt: new Date(),
                    transaction: t,
                })

                await lockedPending.update(
                    {
                        consumedAt: new Date(),
                        consumedUserId: user.id,
                    },
                    { transaction: t }
                )

                return user
            })
        } catch (e) {
            if (e.code === 'NO_PENDING_TELCO') {
                return err(res, { code: 'NO_PENDING_TELCO', message: e.message }, 400)
            }
            if (e.code === 'INVALID_TELCO_PASSWORD') {
                return err(res, { code: 'INVALID_TELCO_PASSWORD', message: e.message }, 401)
            }
            if (e.code === 'USER_EXISTS') {
                return err(res, { code: 'USER_EXISTS', message: e.message }, 400)
            }
            if (e.code === 'NO_TRAINER_FOR_TELCO') {
                return err(res, { code: 'NO_TRAINER_FOR_TELCO', message: e.message }, 500)
            }
            throw e
        }

        const token = jwt.sign(
            { id: result.id, isAdmin: result.isAdmin, isTrainer: result.isTrainer },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        )

        return ok(res, {
            token,
            user: {
                id: result.id,
                phone: result.phone,
                email: result.email,
                name: result.name,
                profilePicture: result.profilePicture,
                dateOfBirth: result.dateOfBirth,
                gender: result.gender,
                isAdmin: result.isAdmin,
                isTrainer: result.isTrainer,
                status: result.status,
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
            },
        })
    } catch (error) {
        console.error('register-telco error:', error)
        return err(res, { code: 'REGISTRATION_FAILED', message: 'Failed to complete registration', error: error.message }, 500)
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
        const webBaseOverride = req.body?.web_base_url
        const apiBaseOverride = req.body?.api_base_url
        const code = crypto.randomBytes(24).toString('hex')
        const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
        webBridgeCodes.set(code, { userId, expiresAt })

        const webBase = resolveFrontendBaseUrl(req, webBaseOverride)
        const apiBase = resolveApiBaseUrl(req, apiBaseOverride)
        const url = `${webBase}/auth/bridge?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}&api_base=${encodeURIComponent(apiBase)}`
        return ok(res, { url, expiresAt, webBase, apiBase })
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


