'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { WorkoutPlan, WorkoutExercise, Trainer, User, UserWorkoutPlanProgress, WorkoutPlanInsight, ConsultBooking, ConsultSlot } = require('../../models')
const { Op } = require('sequelize')
const { requireAuth, optionalAuth } = require('../../middleware/auth')
const { requireMedical } = require('../../middleware/requireMedical')
const { generateWorkoutPlanInsightWithAI } = require('../../utils/WorkoutPlanInsightGenerator')
const { getSubscribedTrainerId } = require('../../services/subscriptionService')

// GET /user/workout-plans - Get all approved, public workout plans
// Use optionalAuth to get userId if authenticated, but allow unauthenticated access
router.get('/', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id
        const { category, difficulty, duration, search } = req.query
        const pagination = getPagination(req.query)

        // Build where clause - only show approved and public workout plans
        const whereClause = {
            status: 'approved',
            isPublic: true
        }

        // Apply filters
        if (category) {
            whereClause.category = category
        }

        if (difficulty) {
            whereClause.difficulty = difficulty
        }

        if (duration) {
            // Duration filter: short (<30min), medium (30-60min), long (>60min)
            switch (duration) {
                case 'short':
                    whereClause.estimatedDuration = { [Op.lt]: 30 }
                    break
                case 'medium':
                    whereClause.estimatedDuration = { [Op.between]: [30, 60] }
                    break
                case 'long':
                    whereClause.estimatedDuration = { [Op.gt]: 60 }
                    break
            }
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }

        // CRITICAL: Filter by subscribed trainer if user has active subscription
        // This ensures users only see workouts from their subscribed trainer
        if (userId) {
            try {
                const subscribedTrainerId = await getSubscribedTrainerId(userId)
                console.log(`[Workout Plans] User ${userId} subscription check:`, {
                    hasSubscription: !!subscribedTrainerId,
                    trainerId: subscribedTrainerId
                })
                
                if (subscribedTrainerId) {
                    whereClause.trainerId = subscribedTrainerId
                    console.log(`[Workout Plans] ✅ Filtering workouts for user ${userId} by subscribed trainer ${subscribedTrainerId}`)
                } else {
                    console.log(`[Workout Plans] ⚠️ User ${userId} has no active subscription - showing all public workouts`)
                }
            } catch (error) {
                console.error('[Workout Plans] ❌ Error checking subscription:', {
                    error: error.message,
                    stack: error.stack,
                    userId: userId
                })
                // Continue without filtering on error - show all public workouts
            }
        } else {
            console.log('[Workout Plans] No userId provided (user not authenticated) - showing all public workouts')
        }

        const result = await executePaginatedQuery(WorkoutPlan, {
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
                    model: UserWorkoutPlanProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false,
                    attributes: ['status', 'completedExercises', 'totalExercises', 'startedAt', 'completedAt']
                }] : [])
            ],
            order: [['createdAt', 'DESC']]
        }, pagination)

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// GET /user/workout-plans/categories - Get available workout plan categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await WorkoutPlan.findAll({
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

// GET /user/workout-plans/:id - Get single workout plan with exercises
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params

        const workoutPlan = await WorkoutPlan.findOne({
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
                {
                    model: WorkoutExercise,
                    as: 'exercises',
                    attributes: ['id', 'name', 'description', 'sets', 'reps', 'duration', 'restTime', 'order', 'notes']
                },
                // Include user's progress if authenticated
                ...(userId ? [{
                    model: UserWorkoutPlanProgress,
                    as: 'userProgress',
                    where: { userId },
                    required: false
                }] : [])
            ]
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        // Filter related plans by subscribed trainer if user has active subscription
        const relatedPlansWhere = {
            id: { [Op.ne]: id },
            status: 'approved',
            isPublic: true,
            [Op.or]: [
                { category: workoutPlan.category },
                { difficulty: workoutPlan.difficulty }
            ]
        }

        // Filter related plans by subscribed trainer if user has active subscription
        if (userId) {
            try {
                const subscribedTrainerId = await getSubscribedTrainerId(userId)
                if (subscribedTrainerId) {
                    relatedPlansWhere.trainerId = subscribedTrainerId
                    console.log(`[Workout Plans] Filtering related plans for user ${userId} by subscribed trainer ${subscribedTrainerId}`)
                }
            } catch (error) {
                console.error('[Workout Plans] Error checking subscription for related plans:', error)
            }
        }

        // Get related workout plans
        const relatedPlans = await WorkoutPlan.findAll({
            where: relatedPlansWhere,
            limit: 6,
            attributes: ['id', 'title', 'description', 'difficulty', 'category', 'estimatedDuration', 'totalExercises'],
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

        ok(res, {
            workoutPlan,
            relatedPlans
        })
    } catch (error) {
        err(res, error)
    }
})

/**
 * Helper function to validate that a user has booked with a medical professional
 * @param {number} userId - The user ID to validate
 * @param {number} medicalProId - The medical professional ID
 * @returns {Promise<boolean>} - True if user has booked with this medical professional
 */
async function validateUserAccess(userId, medicalProId) {
  const booking = await ConsultBooking.findOne({
    include: [
      {
        model: ConsultSlot,
        as: 'slot',
        where: { providerId: medicalProId },
        required: true
      }
    ],
    where: { userId },
    limit: 1
  })
  return !!booking
}

// GET /user/workout-plans/:planId/insight - Get insight for a specific workout plan
router.get('/:planId/insight', requireAuth, async (req, res) => {
  try {
    const { planId } = req.params
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id
    const requestingUserId = req.user.id
    const isMedical = req.user.isMedical || false

    // If requesting for another user, must be a medical professional
    if (userId !== requestingUserId && !isMedical) {
      return err(res, { code: 'FORBIDDEN', message: 'Only medical professionals can view insights for other users' }, 403)
    }

    // If medical professional viewing another user's insight, validate access
    if (userId !== requestingUserId && isMedical) {
      const hasAccess = await validateUserAccess(userId, requestingUserId)
      if (!hasAccess) {
        return err(res, { code: 'FORBIDDEN', message: 'You can only view insights for users you have consulted with' }, 403)
      }
    }

    const insight = await WorkoutPlanInsight.findOne({
      where: {
        workoutPlanId: planId,
        userId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'profilePicture']
        }
      ]
    })

    if (!insight) {
      return err(res, { code: 'NOT_FOUND', message: 'Insight not found' }, 404)
    }

    ok(res, insight)
  } catch (error) {
    err(res, error)
  }
})

// GET /user/workout-plans/:planId/insight/available-users - Get list of users available for insight creation (Medical Professional only)
router.get('/:planId/insight/available-users', requireAuth, requireMedical, async (req, res) => {
  try {
    const { planId } = req.params
    const medicalProId = req.user.id

    // Verify workout plan exists
    const workoutPlan = await WorkoutPlan.findByPk(planId)
    if (!workoutPlan) {
      return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
    }

    // Get all users who have booked with this medical professional
    const bookings = await ConsultBooking.findAll({
      include: [
        {
          model: ConsultSlot,
          as: 'slot',
          where: { providerId: medicalProId },
          required: true
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'profilePicture'],
          required: true
        }
      ],
      attributes: ['userId', 'createdAt'],
      order: [['createdAt', 'DESC']]
    })

    // Get unique users with their most recent booking date
    const userMap = new Map()
    bookings.forEach(booking => {
      const userId = booking.userId
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          phone: booking.user.phone,
          profilePicture: booking.user.profilePicture,
          lastBookingDate: booking.createdAt
        })
      }
    })

    const users = Array.from(userMap.values())

    ok(res, { users })
  } catch (error) {
    err(res, error)
  }
})

// POST /user/workout-plans/:planId/insight - Create or update insight (Medical Professional only)
router.post('/:planId/insight', requireAuth, requireMedical, async (req, res) => {
  try {
    const { planId } = req.params
    const { userId, insightText, customLabels, suitability, sourceType } = req.body
    const medicalProId = req.user.id

    // Validate required fields
    if (!userId || !insightText || !suitability) {
      return err(res, { code: 'BAD_REQUEST', message: 'userId, insightText, and suitability are required' }, 400)
    }

    // Validate suitability enum
    const validSuitability = ['recommended', 'caution', 'not_recommended', 'requires_modification']
    if (!validSuitability.includes(suitability)) {
      return err(res, { code: 'BAD_REQUEST', message: `suitability must be one of: ${validSuitability.join(', ')}` }, 400)
    }

    // Validate sourceType if provided
    if (sourceType) {
      const validSourceTypes = ['ai', 'medical_professional', 'ai_edited']
      if (!validSourceTypes.includes(sourceType)) {
        return err(res, { code: 'BAD_REQUEST', message: `sourceType must be one of: ${validSourceTypes.join(', ')}` }, 400)
      }
    }

    // Verify workout plan exists
    const workoutPlan = await WorkoutPlan.findByPk(planId)
    if (!workoutPlan) {
      return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
    }

    // Validate user access
    const hasAccess = await validateUserAccess(userId, medicalProId)
    if (!hasAccess) {
      return err(res, { code: 'FORBIDDEN', message: 'You can only create insights for users you have consulted with' }, 403)
    }

    // Check if insight already exists
    const existingInsight = await WorkoutPlanInsight.findOne({
      where: {
        workoutPlanId: planId,
        userId
      }
    })

    // Determine sourceType based on existing insight or provided value
    let finalSourceType = sourceType || 'medical_professional'
    if (existingInsight && existingInsight.sourceType === 'ai' && !sourceType) {
      // If editing an AI-generated insight without specifying sourceType, mark as ai_edited
      finalSourceType = 'ai_edited'
    }

    // Create or update insight (using findOrCreate with unique constraint)
    const [insight, created] = await WorkoutPlanInsight.findOrCreate({
      where: {
        workoutPlanId: planId,
        userId
      },
      defaults: {
        userId,
        workoutPlanId: planId,
        insightText,
        customLabels: customLabels || [],
        suitability,
        sourceType: finalSourceType,
        createdBy: medicalProId,
        generatedAt: new Date()
      }
    })

    if (!created) {
      // Update existing insight
      insight.insightText = insightText
      insight.customLabels = customLabels || insight.customLabels
      insight.suitability = suitability
      insight.sourceType = finalSourceType
      insight.createdBy = medicalProId
      insight.generatedAt = new Date()
      await insight.save()
    }

    // Reload with associations
    await insight.reload({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'profilePicture']
        }
      ]
    })

    ok(res, insight)
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return err(res, { code: 'CONFLICT', message: 'An insight already exists for this user and workout plan' }, 409)
    }
    err(res, error)
  }
})

// POST /user/workout-plans/:planId/insight/generate-ai - Generate insight using AI (Medical Professional only)
router.post('/:planId/insight/generate-ai', requireAuth, requireMedical, async (req, res) => {
  try {
    const { planId } = req.params
    const { userId } = req.body
    const medicalProId = req.user.id

    if (!userId) {
      return err(res, { code: 'BAD_REQUEST', message: 'userId is required' }, 400)
    }

    // Verify workout plan exists
    const workoutPlan = await WorkoutPlan.findByPk(planId)
    if (!workoutPlan) {
      return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
    }

    // Validate user access
    const hasAccess = await validateUserAccess(userId, medicalProId)
    if (!hasAccess) {
      return err(res, { code: 'FORBIDDEN', message: 'You can only generate insights for users you have consulted with' }, 403)
    }

    // Generate insight using AI
    const insightData = await generateWorkoutPlanInsightWithAI(planId, userId, {
      includeRules: true,
      maxRetries: 3
    })

    // Create or update insight
    const [insight, created] = await WorkoutPlanInsight.findOrCreate({
      where: {
        workoutPlanId: planId,
        userId
      },
      defaults: {
        userId,
        workoutPlanId: planId,
        insightText: insightData.insightText,
        customLabels: insightData.customLabels,
        suitability: insightData.suitability,
        medicalContext: insightData.medicalContext,
        sourceType: 'ai',
        createdBy: medicalProId,
        generatedAt: new Date()
      }
    })

    if (!created) {
      // Update existing insight
      insight.insightText = insightData.insightText
      insight.customLabels = insightData.customLabels
      insight.suitability = insightData.suitability
      insight.medicalContext = insightData.medicalContext
      insight.sourceType = 'ai'
      insight.createdBy = medicalProId
      insight.generatedAt = new Date()
      await insight.save()
    }

    // Reload with associations
    await insight.reload({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'profilePicture']
        }
      ]
    })

    ok(res, insight)
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return err(res, { code: 'CONFLICT', message: 'An insight already exists for this user and workout plan' }, 409)
    }
    console.error('AI insight generation error:', error)
    err(res, { code: 'SERVER_ERROR', message: error.message || 'Failed to generate insight' }, 500)
  }
})

// DELETE /user/workout-plans/:planId/insight - Delete insight (Medical Professional only)
router.delete('/:planId/insight', requireAuth, requireMedical, async (req, res) => {
  try {
    const { planId } = req.params
    const userId = parseInt(req.query.userId) || req.body.userId
    const medicalProId = req.user.id

    if (!userId) {
      return err(res, { code: 'BAD_REQUEST', message: 'userId is required (as query parameter or in body)' }, 400)
    }

    // Validate user access
    const hasAccess = await validateUserAccess(userId, medicalProId)
    if (!hasAccess) {
      return err(res, { code: 'FORBIDDEN', message: 'You can only delete insights for users you have consulted with' }, 403)
    }

    const insight = await WorkoutPlanInsight.findOne({
      where: {
        workoutPlanId: planId,
        userId
      }
    })

    if (!insight) {
      return err(res, { code: 'NOT_FOUND', message: 'Insight not found' }, 404)
    }

    await insight.destroy()

    ok(res, { message: 'Insight deleted successfully' })
  } catch (error) {
    err(res, error)
  }
})

module.exports = { router }

