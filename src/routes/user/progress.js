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
        const { workoutPlanId, gameId } = req.body

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

        // If gameId is provided, verify the game exists
        if (gameId) {
            const { Game } = require('../../models')
            const game = await Game.findByPk(gameId)
            if (!game) {
                return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404)
            }
        }

        // Check if user already has progress for this plan
        let progress = await UserWorkoutPlanProgress.findOne({
            where: { userId, workoutPlanId }
        })

        if (progress) {
            // Update existing progress
            progress.status = 'active'
            progress.lastAccessedAt = new Date()
            // Update fromGameId if provided and not already set
            if (gameId && !progress.fromGameId) {
                progress.fromGameId = gameId
            }
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
                completedExercises: 0,
                fromGameId: gameId || null
            })
        }

        // Get first exercise to start timer
        const firstExercise = workoutPlan.exercises?.[0]
        let firstExerciseProgress = null
        if (firstExercise) {
            const { UserExerciseProgress } = require('../../models')
            const [exerciseProgress] = await UserExerciseProgress.findOrCreate({
                where: {
                    userId,
                    workoutPlanId,
                    exerciseId: firstExercise.id
                },
                defaults: {
                    userId,
                    workoutPlanId,
                    exerciseId: firstExercise.id,
                    completed: false,
                    startedAt: new Date()
                }
            })
            
            // If exercise progress already exists but doesn't have startedAt, update it
            if (exerciseProgress && !exerciseProgress.startedAt) {
                exerciseProgress.startedAt = new Date()
                await exerciseProgress.save()
            }
            
            if (exerciseProgress) {
                firstExerciseProgress = {
                    exerciseId: exerciseProgress.exerciseId,
                    startedAt: exerciseProgress.startedAt ? exerciseProgress.startedAt.toISOString() : new Date().toISOString(),
                    completed: exerciseProgress.completed
                }
            }
        }

        ok(res, {
            planProgress: progress,
            firstExerciseProgress
        })
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
                
                // Calculate base XP: (totalExercises * 25) + 100 bonus
                let baseXP = planProgress.totalExercises * 25 + 100
                
                // Add 50 XP bonus if this workout plan was won from a game
                if (planProgress.fromGameId) {
                    baseXP += 50
                }
                
                planProgress.xpEarned = baseXP
                
                // Award XP to user
                const { awardXP } = require('../../services/xpService')
                try {
                    await awardXP(
                        userId,
                        baseXP,
                        'workout_plan',
                        `Completed workout plan${planProgress.fromGameId ? ' (won from game)' : ''}`
                    )
                } catch (xpError) {
                    console.error('Error awarding XP for workout plan completion:', xpError)
                    // Don't fail the request if XP award fails
                }
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

