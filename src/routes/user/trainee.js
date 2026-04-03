'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { User, UserProfile, Trainer } = require('../../models')
const { requireAuth } = require('../../middleware')
const {
  PRIMARY_GOALS,
  normalizePrimaryGoal,
  rankTrainersByGoal
} = require('../../utils/traineeTrainerMatch')

router.use(requireAuth)

function skipOnboardingForUser(user) {
  return !!(user && (user.isTrainer || user.isAdmin))
}

// GET /user/trainee/onboarding-status
router.get('/onboarding-status', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'isTrainer', 'isAdmin']
    })
    const profile = await UserProfile.findOne({ where: { userId: req.user.id } })
    const skipped = skipOnboardingForUser(user)
    const completed = skipped || !!profile?.traineeOnboardingCompletedAt
    ok(res, {
      completed,
      skipped,
      traineeOnboardingCompletedAt: profile?.traineeOnboardingCompletedAt || null
    })
  } catch (e) {
    err(res, e)
  }
})

// POST /user/trainee/onboarding
router.post('/onboarding', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'isTrainer', 'isAdmin']
    })
    if (skipOnboardingForUser(user)) {
      return ok(res, { message: 'Onboarding not required for this account', completed: true })
    }

    const {
      height,
      weight,
      primaryGoal,
      secondaryGoals,
      activityLevel,
      fitnessLevel,
      targetWeight
    } = req.body || {}

    const primary = normalizePrimaryGoal(primaryGoal)
    if (!PRIMARY_GOALS.includes(primary)) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid primaryGoal' }, 400)
    }

    const h = height != null ? Number(height) : null
    const w = weight != null ? Number(weight) : null
    if (h == null || Number.isNaN(h) || h <= 0 || h > 300) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Valid height (cm) is required' }, 400)
    }
    if (w == null || Number.isNaN(w) || w <= 0 || w > 500) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Valid weight (kg) is required' }, 400)
    }

    let profile = await UserProfile.findOne({ where: { userId: req.user.id } })
    const prevGoals = profile?.fitnessGoals && typeof profile.fitnessGoals === 'object' ? profile.fitnessGoals : {}
    const prevHealth = profile?.healthMetrics && typeof profile.healthMetrics === 'object' ? profile.healthMetrics : {}

    const fitnessGoals = {
      ...prevGoals,
      primary,
      secondary: Array.isArray(secondaryGoals) ? secondaryGoals.filter((x) => typeof x === 'string') : prevGoals.secondary || [],
      fitnessLevel: fitnessLevel || prevGoals.fitnessLevel || 'beginner',
      targetWeight: targetWeight != null ? Number(targetWeight) : prevGoals.targetWeight ?? null
    }

    const healthMetrics = {
      ...prevHealth,
      height: h,
      weight: w,
      activityLevel: activityLevel || prevHealth.activityLevel || 'moderate'
    }

    const now = new Date()
    await UserProfile.upsert({
      userId: req.user.id,
      fitnessGoals,
      healthMetrics,
      traineeOnboardingCompletedAt: now
    })

    ok(res, {
      message: 'Trainee profile saved',
      traineeOnboardingCompletedAt: now,
      fitnessGoals,
      healthMetrics
    })
  } catch (e) {
    err(res, e)
  }
})

// GET /user/trainee/trainer-matches
router.get('/trainer-matches', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'isTrainer', 'isAdmin']
    })
    const profile = await UserProfile.findOne({ where: { userId: req.user.id } })

    if (!skipOnboardingForUser(user) && !profile?.traineeOnboardingCompletedAt) {
      return err(res, {
        code: 'ONBOARDING_REQUIRED',
        message: 'Complete your fitness profile before browsing matched trainers'
      }, 403)
    }

    const primaryGoal = profile?.fitnessGoals?.primary || 'general_fitness'

    const trainers = await Trainer.findAll({
      where: { verified: true },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']]
    })

    const formatted = trainers.map((trainer) => {
      const t = trainer.toJSON()
      const name = t.User?.name || 'Unknown'
      let slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
      if (!slug || slug.length === 0) slug = `trainer-${t.userId}`
      else slug = `${slug}-${t.userId}`

      return {
        userId: t.userId,
        name,
        slug,
        profilePicture: t.User?.profilePicture || null,
        specialties: t.specialties || []
      }
    })

    const ranked = rankTrainersByGoal(formatted, primaryGoal)
    ok(res, { items: ranked, primaryGoal: normalizePrimaryGoal(primaryGoal) })
  } catch (e) {
    err(res, e)
  }
})

module.exports = { router }
