'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { WorkoutPlan, WorkoutExercise, Trainer, User, UserWorkoutPlanProgress } = require('../../models')
const { Op } = require('sequelize')

// GET /user/workout-plans - Get all approved, public workout plans
router.get('/', async (req, res) => {
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
router.get('/:id', async (req, res) => {
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

        // Get related workout plans
        const relatedPlans = await WorkoutPlan.findAll({
            where: {
                id: { [Op.ne]: id },
                status: 'approved',
                isPublic: true,
                [Op.or]: [
                    { category: workoutPlan.category },
                    { difficulty: workoutPlan.difficulty }
                ]
            },
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

module.exports = { router }

