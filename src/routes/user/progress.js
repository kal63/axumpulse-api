'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const {
    UserWorkoutPlanProgress,
    UserExerciseProgress,
    UserChallengeProgress,
    WorkoutPlan,
    WorkoutExercise,
    Challenge,
    User
} = require('../../models')
const { requireAuth } = require('../../middleware')
const { Op } = require('sequelize')

// All progress routes require authentication
router.use(requireAuth)

// POST /user/progress/workout-plan/start - Start a workout plan
router.post('/workout-plan/start', async (req, res) => {
    try {
        const userId = req.user.id
        const { workoutPlanId } = req.body

        if (!workoutPlanId) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'workoutPlanId is required' }, 400)
        }

        // Check if workout plan exists and is accessible
        const workoutPlan = await WorkoutPlan.findOne({
            where: {
                id: workoutPlanId,
                status: 'approved',
                isPublic: true
            },
            include: [{
                model: WorkoutExercise,
                as: 'exercises'
            }]
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        // Check if user already has progress for this plan
        let progress = await UserWorkoutPlanProgress.findOne({
            where: { userId, workoutPlanId }
        })

        if (progress) {
            // Update existing progress
            progress.status = 'active'
            progress.lastAccessedAt = new Date()
            await progress.save()
        } else {
            // Create new progress
            progress = await UserWorkoutPlanProgress.create({
                userId,
                workoutPlanId,
                status: 'active',
                startedAt: new Date(),
                lastAccessedAt: new Date(),
                totalExercises: workoutPlan.exercises?.length || 0,
                completedExercises: 0
            })
        }

        ok(res, progress)
    } catch (error) {
        err(res, error)
    }
})

// POST /user/progress/exercise/complete - Mark an exercise as completed
router.post('/exercise/complete', async (req, res) => {
    try {
        const userId = req.user.id
        const { workoutPlanId, exerciseId, notes } = req.body

        if (!workoutPlanId || !exerciseId) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'workoutPlanId and exerciseId are required' }, 400)
        }

        // Check if exercise exists
        const exercise = await WorkoutExercise.findByPk(exerciseId)
        if (!exercise) {
            return err(res, { code: 'NOT_FOUND', message: 'Exercise not found' }, 404)
        }

        // Find or create exercise progress
        let [exerciseProgress, created] = await UserExerciseProgress.findOrCreate({
            where: { userId, workoutPlanId, exerciseId },
            defaults: {
                userId,
                workoutPlanId,
                exerciseId,
                completed: true,
                completedAt: new Date(),
                xpEarned: 25, // Base XP for completing an exercise
                notes: notes || null
            }
        })

        if (!created && !exerciseProgress.completed) {
            // Mark as completed if not already
            exerciseProgress.completed = true
            exerciseProgress.completedAt = new Date()
            exerciseProgress.xpEarned = 25
            exerciseProgress.notes = notes || exerciseProgress.notes
            await exerciseProgress.save()
        }

        // Update workout plan progress
        const planProgress = await UserWorkoutPlanProgress.findOne({
            where: { userId, workoutPlanId }
        })

        if (planProgress) {
            // Count completed exercises
            const completedCount = await UserExerciseProgress.count({
                where: {
                    userId,
                    workoutPlanId,
                    completed: true
                }
            })

            planProgress.completedExercises = completedCount
            planProgress.lastAccessedAt = new Date()

            // Check if plan is completed
            if (completedCount >= planProgress.totalExercises) {
                planProgress.status = 'completed'
                planProgress.completedAt = new Date()
                planProgress.xpEarned = planProgress.totalExercises * 25 + 100 // Bonus XP for completing plan
            }

            await planProgress.save()
        }

        ok(res, {
            exerciseProgress,
            planProgress
        })
    } catch (error) {
        err(res, error)
    }
})

// POST /user/progress/challenge/join - Join a challenge
router.post('/challenge/join', async (req, res) => {
    try {
        const userId = req.user.id
        const { challengeId } = req.body

        if (!challengeId) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'challengeId is required' }, 400)
        }

        // Check if challenge exists and is active
        const challenge = await Challenge.findOne({
            where: {
                id: challengeId,
                status: 'approved',
                isPublic: true,
                startTime: { [Op.lte]: new Date() },
                endTime: { [Op.gte]: new Date() }
            }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found or not active' }, 404)
        }

        // Check if user already joined
        let progress = await UserChallengeProgress.findOne({
            where: { userId, challengeId }
        })

        if (progress) {
            return err(res, { code: 'ALREADY_JOINED', message: 'You have already joined this challenge' }, 400)
        }

        // Create progress entry
        progress = await UserChallengeProgress.create({
            userId,
            challengeId,
            status: 'active',
            progress: 0,
            joinedAt: new Date()
        })

        ok(res, progress)
    } catch (error) {
        err(res, error)
    }
})

// POST /user/progress/challenge/update - Update challenge progress
router.post('/challenge/update', async (req, res) => {
    try {
        const userId = req.user.id
        const { challengeId, progress: progressValue } = req.body

        if (!challengeId || progressValue === undefined) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'challengeId and progress are required' }, 400)
        }

        // Find user's challenge progress
        const progress = await UserChallengeProgress.findOne({
            where: { userId, challengeId }
        })

        if (!progress) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge progress not found. Please join the challenge first.' }, 404)
        }

        // Get challenge details
        const challenge = await Challenge.findByPk(challengeId)
        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Update progress
        progress.progress = Math.min(parseInt(progressValue), challenge.goalValue || 100)

        // Check if completed
        if (progress.progress >= (challenge.goalValue || 100) && progress.status !== 'completed') {
            progress.status = 'completed'
            progress.completedAt = new Date()
            progress.xpEarned = challenge.xpReward || 500 // Award XP
        }

        await progress.save()

        ok(res, progress)
    } catch (error) {
        err(res, error)
    }
})

// GET /user/progress/my-workout-plans - Get user's active workout plans
router.get('/my-workout-plans', async (req, res) => {
    try {
        const userId = req.user.id

        const myPlans = await UserWorkoutPlanProgress.findAll({
            where: {
                userId,
                status: { [Op.in]: ['active', 'completed'] }
            },
            include: [
                {
                    model: WorkoutPlan,
                    as: 'workoutPlan',
                    attributes: ['id', 'title', 'description', 'difficulty', 'category', 'estimatedDuration']
                }
            ],
            order: [['lastAccessedAt', 'DESC']]
        })

        ok(res, { items: myPlans })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/progress/my-challenges - Get user's active challenges
router.get('/my-challenges', async (req, res) => {
    try {
        const userId = req.user.id

        const myChallenges = await UserChallengeProgress.findAll({
            where: {
                userId,
                status: { [Op.in]: ['active', 'completed'] }
            },
            include: [
                {
                    model: Challenge,
                    as: 'challenge',
                    attributes: ['id', 'title', 'description', 'difficulty', 'type', 'startTime', 'endTime', 'xpReward', 'duration']
                }
            ],
            order: [['joinedAt', 'DESC']]
        })

        ok(res, { items: myChallenges })
    } catch (error) {
        err(res, error)
    }
})

// GET /user/progress/workout-plan/:id - Get detailed progress for a workout plan
router.get('/workout-plan/:id', async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        const progress = await UserWorkoutPlanProgress.findOne({
            where: {
                userId,
                workoutPlanId: id
            },
            include: [
                {
                    model: WorkoutPlan,
                    as: 'workoutPlan',
                    include: [{
                        model: WorkoutExercise,
                        as: 'exercises'
                    }]
                }
            ]
        })

        if (!progress) {
            return err(res, { code: 'NOT_FOUND', message: 'Progress not found' }, 404)
        }

        // Get exercise-level progress
        const exerciseProgress = await UserExerciseProgress.findAll({
            where: {
                userId,
                workoutPlanId: id
            },
            include: [{
                model: WorkoutExercise,
                as: 'exercise'
            }]
        })

        ok(res, {
            planProgress: progress,
            exerciseProgress
        })
    } catch (error) {
        err(res, error)
    }
})

module.exports = { router }

