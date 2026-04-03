'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination')
const {
    WorkoutPlan,
    WorkoutExercise,
    Content,
    UserExerciseProgress,
    UserWorkoutPlanProgress,
    sequelize
} = require('../../models')
const { resolveApprovedVideoContentId } = require('../../utils/validateTrainerVideoContent')

const CONTENT_PICK_ATTRS = ['id', 'title', 'fileUrl', 'thumbnailUrl', 'duration', 'type', 'status', 'trainerId']

function mapContentErr(res, e) {
    const status = e.code === 'NOT_FOUND' ? 404 : e.code === 'FORBIDDEN' ? 403 : 400
    return err(res, { code: e.code || 'VALIDATION_ERROR', message: e.message }, status)
}

// GET /trainer/workout-plans
router.get('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const { status, difficulty } = req.query
        const pagination = getPagination(req.query)

        const where = { trainerId }
        if (status) where.status = status
        if (difficulty) where.difficulty = difficulty

        const result = await executePaginatedQueryWithSeparateCount(WorkoutPlan, {
            where,
            include: [
                {
                    model: Content,
                    as: 'introContent',
                    required: false,
                    attributes: CONTENT_PICK_ATTRS
                },
                {
                    model: WorkoutExercise,
                    as: 'exercises',
                    include: [
                        {
                            model: Content,
                            as: 'exerciseContent',
                            required: false,
                            attributes: CONTENT_PICK_ATTRS
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        }, pagination)

        // Sort exercises by order after fetching
        result.items.forEach(workoutPlan => {
            if (workoutPlan.exercises) {
                workoutPlan.exercises.sort((a, b) => a.order - b.order)
            }
        })

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// GET /trainer/workout-plans/:id
router.get('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId },
            include: [
                {
                    model: Content,
                    as: 'introContent',
                    required: false,
                    attributes: CONTENT_PICK_ATTRS
                },
                {
                    model: WorkoutExercise,
                    as: 'exercises',
                    include: [
                        {
                            model: Content,
                            as: 'exerciseContent',
                            required: false,
                            attributes: CONTENT_PICK_ATTRS
                        }
                    ]
                }
            ]
        })

        // Sort exercises by order after fetching
        if (workoutPlan && workoutPlan.exercises) {
            workoutPlan.exercises.sort((a, b) => a.order - b.order)
        }

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        ok(res, { workoutPlan })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/workout-plans
router.post('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const { title, description, difficulty, category, language, tags, isPublic, estimatedDuration } = req.body

        // Validation
        if (!title) return err(res, { code: 'VALIDATION_ERROR', message: 'title is required' }, 400)
        if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        let planContentId
        if ('contentId' in req.body && req.body.contentId !== undefined) {
            try {
                planContentId = await resolveApprovedVideoContentId(trainerId, req.body.contentId)
            } catch (e) {
                return mapContentErr(res, e)
            }
        }

        const workoutPlan = await WorkoutPlan.create({
            trainerId,
            title,
            description,
            difficulty: difficulty || 'beginner',
            category,
            language,
            tags: Array.isArray(tags) ? tags : [],
            isPublic: isPublic !== undefined ? !!isPublic : true,
            estimatedDuration,
            status: 'draft',
            ...(planContentId !== undefined ? { contentId: planContentId } : {})
        })

        ok(res, { workoutPlan })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/workout-plans/:id
router.put('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        // Validation
        if (req.body.difficulty && !['beginner', 'intermediate', 'advanced'].includes(req.body.difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        // If workout plan is approved and being edited, change status to draft
        if (workoutPlan.status === 'approved') {
            workoutPlan.status = 'draft'
        }

        const updatable = ['title', 'description', 'difficulty', 'category', 'language', 'tags', 'isPublic', 'estimatedDuration']
        for (const key of updatable) {
            if (key in req.body) {
                workoutPlan[key] = key === 'tags' && !Array.isArray(req.body[key]) ? [] : req.body[key]
            }
        }

        if ('contentId' in req.body && req.body.contentId !== undefined) {
            try {
                workoutPlan.contentId = await resolveApprovedVideoContentId(trainerId, req.body.contentId)
            } catch (e) {
                return mapContentErr(res, e)
            }
        }

        await workoutPlan.save()

        const refreshed = await WorkoutPlan.findByPk(workoutPlan.id, {
            include: [
                {
                    model: Content,
                    as: 'introContent',
                    required: false,
                    attributes: CONTENT_PICK_ATTRS
                },
                {
                    model: WorkoutExercise,
                    as: 'exercises',
                    include: [
                        {
                            model: Content,
                            as: 'exerciseContent',
                            required: false,
                            attributes: CONTENT_PICK_ATTRS
                        }
                    ]
                }
            ]
        })
        if (refreshed && refreshed.exercises) {
            refreshed.exercises.sort((a, b) => a.order - b.order)
        }

        ok(res, { workoutPlan: refreshed || workoutPlan })
    } catch (error) {
        err(res, error)
    }
})

// DELETE /trainer/workout-plans/:id
router.delete('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        await workoutPlan.destroy()
        ok(res, { deleted: true })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/workout-plans/:id/exercises
router.post('/:id/exercises', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        const { name, description, category, muscleGroups, equipment, sets, reps, weight, duration, restTime, notes } = req.body

        if (!name) return err(res, { code: 'VALIDATION_ERROR', message: 'name is required' }, 400)

        // Get the next order number
        const lastExercise = await WorkoutExercise.findOne({
            where: { workoutPlanId: workoutPlan.id },
            order: [['order', 'DESC']]
        })
        const order = lastExercise ? lastExercise.order + 1 : 1

        let exerciseContentId
        if ('contentId' in req.body && req.body.contentId !== undefined) {
            try {
                exerciseContentId = await resolveApprovedVideoContentId(trainerId, req.body.contentId)
            } catch (e) {
                return mapContentErr(res, e)
            }
        }

        const exercise = await WorkoutExercise.create({
            workoutPlanId: workoutPlan.id,
            name,
            description,
            category,
            muscleGroups: Array.isArray(muscleGroups) ? muscleGroups : [],
            equipment,
            sets,
            reps,
            weight,
            duration,
            restTime,
            order,
            notes,
            ...(exerciseContentId !== undefined ? { contentId: exerciseContentId } : {})
        })

        // Update total exercises count
        workoutPlan.totalExercises = await WorkoutExercise.count({ where: { workoutPlanId: workoutPlan.id } })
        await workoutPlan.save()

        const exerciseOut = await WorkoutExercise.findByPk(exercise.id, {
            include: [
                {
                    model: Content,
                    as: 'exerciseContent',
                    required: false,
                    attributes: CONTENT_PICK_ATTRS
                }
            ]
        })

        ok(res, { exercise: exerciseOut })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/workout-plans/:id/exercises/:exerciseId
router.put('/:id/exercises/:exerciseId', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        const exercise = await WorkoutExercise.findOne({
            where: { id: req.params.exerciseId, workoutPlanId: workoutPlan.id }
        })

        if (!exercise) {
            return err(res, { code: 'NOT_FOUND', message: 'Exercise not found' }, 404)
        }

        const updatable = ['name', 'description', 'category', 'muscleGroups', 'equipment', 'sets', 'reps', 'weight', 'duration', 'restTime', 'order', 'notes']
        for (const key of updatable) {
            if (key in req.body) {
                exercise[key] = key === 'muscleGroups' && !Array.isArray(req.body[key]) ? [] : req.body[key]
            }
        }

        if ('contentId' in req.body && req.body.contentId !== undefined) {
            try {
                exercise.contentId = await resolveApprovedVideoContentId(trainerId, req.body.contentId)
            } catch (e) {
                return mapContentErr(res, e)
            }
        }

        await exercise.save()

        const exerciseOut = await WorkoutExercise.findByPk(exercise.id, {
            include: [
                {
                    model: Content,
                    as: 'exerciseContent',
                    required: false,
                    attributes: CONTENT_PICK_ATTRS
                }
            ]
        })

        ok(res, { exercise: exerciseOut })
    } catch (error) {
        err(res, error)
    }
})

// DELETE /trainer/workout-plans/:id/exercises/:exerciseId
router.delete('/:id/exercises/:exerciseId', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        const exercise = await WorkoutExercise.findOne({
            where: { id: req.params.exerciseId, workoutPlanId: workoutPlan.id }
        })

        if (!exercise) {
            return err(res, { code: 'NOT_FOUND', message: 'Exercise not found' }, 404)
        }

        const exerciseId = exercise.id
        const planId = workoutPlan.id

        await sequelize.transaction(async (transaction) => {
            await UserExerciseProgress.destroy({
                where: { exerciseId },
                transaction
            })

            await exercise.destroy({ transaction })

            const newTotal = await WorkoutExercise.count({
                where: { workoutPlanId: planId },
                transaction
            })

            workoutPlan.totalExercises = newTotal
            await workoutPlan.save({ transaction })

            const progresses = await UserWorkoutPlanProgress.findAll({
                where: { workoutPlanId: planId },
                transaction
            })

            for (const p of progresses) {
                const completedCount = await UserExerciseProgress.count({
                    where: {
                        userId: p.userId,
                        workoutPlanId: planId,
                        completed: true
                    },
                    transaction
                })
                p.totalExercises = newTotal
                p.completedExercises = completedCount
                if (p.status === 'completed' && newTotal > 0 && completedCount < newTotal) {
                    p.status = 'active'
                    p.completedAt = null
                }
                await p.save({ transaction })
            }
        })

        ok(res, { deleted: true })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/workout-plans/:id/submit - Submit workout plan for approval
router.post('/:id/submit', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId },
            include: [
                {
                    model: WorkoutExercise,
                    as: 'exercises'
                }
            ]
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        // Check status - can only submit draft or rejected plans
        if (workoutPlan.status !== 'draft' && workoutPlan.status !== 'rejected') {
            return err(res, {
                code: 'INVALID_STATUS',
                message: `Cannot submit workout plan with status '${workoutPlan.status}'`
            }, 400)
        }

        // Validate has at least 1 exercise
        if (!workoutPlan.exercises || workoutPlan.exercises.length === 0) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Cannot submit workout plan without exercises'
            }, 400)
        }

        // Update status to pending and clear rejection reason
        workoutPlan.status = 'pending'
        workoutPlan.rejectionReason = null
        workoutPlan.rejectedBy = null
        workoutPlan.rejectedAt = null
        await workoutPlan.save()

        ok(res, workoutPlan)
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/workout-plans/:id/withdraw - Withdraw pending submission
router.post('/:id/withdraw', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const workoutPlan = await WorkoutPlan.findOne({
            where: { id: req.params.id, trainerId }
        })

        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404)
        }

        // Can only withdraw pending plans
        if (workoutPlan.status !== 'pending') {
            return err(res, {
                code: 'INVALID_STATUS',
                message: `Cannot withdraw workout plan with status '${workoutPlan.status}'`
            }, 400)
        }

        // Update status back to draft
        workoutPlan.status = 'draft'
        await workoutPlan.save()

        ok(res, workoutPlan)
    } catch (error) {
        err(res, error)
    }
})

module.exports = router

