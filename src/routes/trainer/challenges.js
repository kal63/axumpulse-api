'use strict'

const express = require('express')
const router = express.Router()
const { Challenge } = require('../../models')
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { Op } = require('sequelize')

// GET /trainer/challenges - Get all challenges for the trainer
router.get('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const { status, type, difficulty, search } = req.query
        const pagination = getPagination(req.query)

        const whereClause = {
            trainerId,
            isTrainerCreated: true
        }

        // Add filters
        if (status && status !== 'all') {
            whereClause.status = status
        }
        if (type && type !== 'all') {
            whereClause.type = type
        }
        if (difficulty && difficulty !== 'all') {
            whereClause.difficulty = difficulty
        }
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }

        const result = await executePaginatedQuery(Challenge, {
            where: whereClause,
            order: [['createdAt', 'DESC']],
        }, pagination)

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// GET /trainer/challenges/:id - Get a specific challenge
router.get('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const challengeId = req.params.id

        const challenge = await Challenge.findOne({
            where: { id: challengeId, trainerId, isTrainerCreated: true }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        ok(res, { challenge })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/challenges - Create a new challenge
router.post('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const {
            title,
            description,
            type,
            difficulty,
            duration,
            xpReward,
            requirements,
            contentIds,
            language,
            isPublic,
            startDate,
            endDate,
            isDailyChallenge,
            fitnessLevel,
            recurrencePattern,
            autoAssign
        } = req.body

        // Validation
        if (!title) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'title is required' }, 400)
        }

        if (type && !['fitness', 'nutrition', 'wellness', 'achievement'].includes(type)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'type must be one of: fitness, nutrition, wellness, achievement' }, 400)
        }

        if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        if (fitnessLevel && !['beginner', 'intermediate', 'advanced'].includes(fitnessLevel)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'fitnessLevel must be one of: beginner, intermediate, advanced' }, 400)
        }

        const challenge = await Challenge.create({
            trainerId,
            title,
            description,
            ruleJson: {}, // Required field for the model
            type: type || 'fitness',
            difficulty: difficulty || 'beginner',
            duration: duration || 7,
            xpReward: xpReward || 100,
            requirements: requirements || '',
            contentIds: contentIds || [],
            language: language || 'en',
            isPublic: isPublic !== undefined ? isPublic : true,
            startTime: startDate, // Map startDate to startTime
            endTime: endDate, // Map endDate to endTime
            status: 'draft',
            isTrainerCreated: true,
            kind: 'trainer_challenge', // Use kind field to distinguish from admin challenges
            isDailyChallenge: isDailyChallenge || false,
            fitnessLevel: fitnessLevel || null,
            recurrencePattern: recurrencePattern || null,
            autoAssign: autoAssign || false
        })

        ok(res, { challenge })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/challenges/:id - Update a challenge
router.put('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const challengeId = req.params.id

        const challenge = await Challenge.findOne({
            where: { id: challengeId, trainerId, isTrainerCreated: true }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Validation
        if (req.body.type && !['fitness', 'nutrition', 'wellness', 'achievement'].includes(req.body.type)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'type must be one of: fitness, nutrition, wellness, achievement' }, 400)
        }

        if (req.body.difficulty && !['beginner', 'intermediate', 'advanced'].includes(req.body.difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        // If challenge is approved and being edited, change status to draft
        if (challenge.status === 'approved') {
            challenge.status = 'draft'
        }

        const updatable = [
            'title', 'description', 'type', 'difficulty', 'duration',
            'xpReward', 'requirements', 'contentIds', 'language',
            'isPublic', 'startDate', 'endDate',
            'isDailyChallenge', 'fitnessLevel', 'recurrencePattern', 'autoAssign'
        ]

        for (const key of updatable) {
            if (key in req.body) {
                challenge[key] = req.body[key]
            }
        }

        await challenge.save()
        ok(res, { challenge })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/challenges/:id/submit - Submit challenge for approval
router.put('/:id/submit', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const challengeId = req.params.id

        const challenge = await Challenge.findOne({
            where: { id: challengeId, trainerId, isTrainerCreated: true }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        if (challenge.status !== 'draft' && challenge.status !== 'rejected') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Only draft or rejected challenges can be submitted for approval' }, 400)
        }

        // Validate required fields for submission
        if (!challenge.title || !challenge.description) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Title and description are required for submission' }, 400)
        }

        challenge.status = 'pending'
        await challenge.save()

        ok(res, { challenge })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/challenges/:id/withdraw - Withdraw pending submission
router.post('/:id/withdraw', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const challenge = await Challenge.findOne({
            where: { id: req.params.id, trainerId, isTrainerCreated: true }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Can only withdraw pending challenges
        if (challenge.status !== 'pending') {
            return err(res, {
                code: 'INVALID_STATUS',
                message: `Cannot withdraw challenge with status '${challenge.status}'`
            }, 400)
        }

        // Update status back to draft
        challenge.status = 'draft'
        await challenge.save()

        ok(res, challenge)
    } catch (error) {
        err(res, error)
    }
})

// DELETE /trainer/challenges/:id - Delete a challenge
router.delete('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const challengeId = req.params.id

        const challenge = await Challenge.findOne({
            where: { id: challengeId, trainerId, isTrainerCreated: true }
        })

        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404)
        }

        // Only allow deletion of draft challenges
        if (challenge.status !== 'draft') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Only draft challenges can be deleted' }, 400)
        }

        await challenge.destroy()
        ok(res, { message: 'Challenge deleted successfully' })
    } catch (error) {
        err(res, error)
    }
})

module.exports = router
