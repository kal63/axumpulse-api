'use strict'

const express = require('express')
const router = express.Router()
const fs = require('fs')
const path = require('path')
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../utils/pagination')
const { Content } = require('../../models')
const { Op } = require('sequelize')

// GET /trainer/content
router.get('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const { type, status, isPublic, search } = req.query
        const pagination = getPagination(req.query)

        // Build where clause with filters
        const whereClause = { trainerId }

        if (type && type !== 'all') {
            whereClause.type = type
        }

        if (status && status !== 'all') {
            whereClause.status = status
        }

        if (isPublic !== undefined && isPublic !== 'all') {
            whereClause.isPublic = isPublic === 'true'
        }

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ]
        }

        const result = await executePaginatedQuery(Content, {
            where: whereClause,
            order: [['createdAt', 'DESC']],
        }, pagination)

        ok(res, result)
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/content
router.post('/', async (req, res) => {
    try {
        const trainerId = req.user?.id
        if (!trainerId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'Trainer ID not found in request. Please ensure you are logged in as a trainer.' }, 401)
        }
        
        const payload = req.body || {}
        const { title, description, type, fileUrl, thumbnailUrl, duration, difficulty, category, language, tags, isPublic } = payload

        // Common validations
        if (!title) return err(res, { code: 'VALIDATION_ERROR', message: 'title is required' }, 400)
        if (!type) return err(res, { code: 'VALIDATION_ERROR', message: 'type is required' }, 400)

        // Type-specific validations
        const validTypes = ['video', 'image', 'document']
        if (!validTypes.includes(type)) {
            return err(res, { code: 'VALIDATION_ERROR', message: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, 400)
        }

        // Type-specific requirements (only validate duration for videos during creation)
        switch (type) {
            case 'video':
                // Only validate duration if provided during creation
                if (duration && duration <= 0) return err(res, { code: 'VALIDATION_ERROR', message: 'duration must be greater than 0 for video content' }, 400)
                break

            case 'image':
            case 'document':
                // No file validation during creation - files are uploaded separately
                break

            default:
                return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid content type' }, 400)
        }

        // Optional validations
        if (difficulty && !['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        if (category && typeof category !== 'string') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'category must be a string' }, 400)
        }

        if (language && typeof language !== 'string') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'language must be a string' }, 400)
        }

        const content = await Content.create({
            trainerId,
            title,
            description,
            type,
            fileUrl,
            thumbnailUrl,
            duration,
            difficulty,
            category,
            language,
            tags: Array.isArray(tags) ? tags : [],
            isPublic: isPublic !== undefined ? !!isPublic : true,
            status: 'draft',
        })

        ok(res, { content })
    } catch (error) {
        err(res, error)
    }
})

// GET /trainer/content/:id
router.get('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const content = await Content.findByPk(req.params.id)
        if (!content || content.trainerId !== trainerId) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }
        ok(res, { content })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/content/:id
// IMPORTANT: This route must be defined before any /site routes to prevent route conflicts
router.put('/:id', async (req, res) => {
    try {
        // Log the request to debug route matching
        console.log('[Content Route] PUT /trainer/content/:id called', {
            id: req.params.id,
            url: req.url,
            originalUrl: req.originalUrl,
            path: req.path,
            baseUrl: req.baseUrl,
            route: '/trainer/content/:id',
            method: req.method
        })
        
        // Safety check: Ensure we're handling the correct route
        if (req.originalUrl && req.originalUrl.includes('/trainer/site/')) {
            console.error('[Content Route] ERROR: This route should not handle /trainer/site requests!', {
                originalUrl: req.originalUrl,
                url: req.url
            })
            return err(res, { 
                code: 'ROUTE_MISMATCH', 
                message: 'This endpoint is for regular content, not trainer site content.' 
            }, 400)
        }
        
        const trainerId = req.user?.id
        if (!trainerId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'Trainer ID not found in request' }, 401)
        }
        
        const content = await Content.findByPk(req.params.id)
        if (!content) {
            return err(res, { code: 'NOT_FOUND', message: `Content with ID ${req.params.id} not found` }, 404)
        }
        
        if (content.trainerId !== trainerId) {
            return err(res, { code: 'FORBIDDEN', message: 'You do not have permission to update this content' }, 403)
        }

        // Validate type if it's being updated
        if (req.body.type) {
            const validTypes = ['video', 'image', 'document']
            if (!validTypes.includes(req.body.type)) {
                return err(res, { code: 'VALIDATION_ERROR', message: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, 400)
            }
        }

        // Validate difficulty if it's being updated
        if (req.body.difficulty && !['beginner', 'intermediate', 'advanced'].includes(req.body.difficulty)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'difficulty must be one of: beginner, intermediate, advanced' }, 400)
        }

        // Validate category if it's being updated
        if (req.body.category && typeof req.body.category !== 'string') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'category must be a string' }, 400)
        }

        // Validate language if it's being updated
        if (req.body.language && typeof req.body.language !== 'string') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'language must be a string' }, 400)
        }

        // Validate duration for video content
        if (req.body.type === 'video' || content.type === 'video') {
            const finalType = req.body.type || content.type
            const finalFileUrl = req.body.fileUrl || content.fileUrl
            const finalDuration = req.body.duration || content.duration

            if (finalType === 'video') {
                if (!finalFileUrl) return err(res, { code: 'VALIDATION_ERROR', message: 'fileUrl is required for video content' }, 400)
                if (!finalDuration || finalDuration <= 0) return err(res, { code: 'VALIDATION_ERROR', message: 'duration is required and must be greater than 0 for video content' }, 400)
            }
        }

        // Validate file requirements for other types (only if explicitly updating type)
        if (req.body.type && req.body.type !== content.type) {
            const finalType = req.body.type
            const finalFileUrl = req.body.fileUrl || content.fileUrl

            if (['image', 'document'].includes(finalType) && !finalFileUrl) {
                return err(res, { code: 'VALIDATION_ERROR', message: `fileUrl is required for ${finalType} content` }, 400)
            }
        }

        // If content is approved and being edited, change status to draft
        if (content.status === 'approved') {
            content.status = 'draft'
        }

        const updatable = ['title', 'description', 'type', 'fileUrl', 'thumbnailUrl', 'duration', 'difficulty', 'category', 'language', 'tags', 'isPublic']
        for (const key of updatable) {
            if (key in req.body) {
                content[key] = key === 'tags' && !Array.isArray(req.body[key]) ? [] : req.body[key]
            }
        }
        await content.save()
        ok(res, { content })
    } catch (error) {
        err(res, error)
    }
})

// DELETE /trainer/content/:id
router.delete('/:id', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const content = await Content.findByPk(req.params.id)
        if (!content || content.trainerId !== trainerId) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Delete associated files before deleting the database record
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

        // Delete main file if it exists
        if (content.fileUrl) {
            const fileName = path.basename(content.fileUrl)
            const filePath = path.join(uploadsDir, fileName)
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }
            } catch (fileError) {
                console.error('Error deleting main file:', fileError)
                // Continue with deletion even if file deletion fails
            }
        }

        // Delete thumbnail file if it exists
        if (content.thumbnailUrl) {
            const thumbnailName = path.basename(content.thumbnailUrl)
            const thumbnailPath = path.join(uploadsDir, thumbnailName)
            try {
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath)
                }
            } catch (fileError) {
                console.error('Error deleting thumbnail file:', fileError)
                // Continue with deletion even if file deletion fails
            }
        }

        // Delete the database record
        await content.destroy()
        ok(res, { deleted: true })
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/content/:id/submit
router.put('/:id/submit', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const content = await Content.findByPk(req.params.id)

        if (!content || content.trainerId !== trainerId) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Only allow submitting drafts or rejected content
        if (content.status !== 'draft' && content.status !== 'rejected') {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Only draft or rejected content can be submitted for approval' }, 400)
        }

        // Validate that required fields are present for submission
        if (!content.title || !content.type) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Title and type are required for submission' }, 400)
        }

        // Type-specific validation for submission
        if (['video', 'image', 'document'].includes(content.type) && !content.fileUrl) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'File is required for submission' }, 400)
        }

        if (content.type === 'video' && (!content.duration || content.duration <= 0)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Duration is required for video content' }, 400)
        }

        // Update status to pending
        content.status = 'pending'
        await content.save()

        ok(res, { content })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/content/:id/withdraw - Withdraw pending submission
router.post('/:id/withdraw', async (req, res) => {
    try {
        const trainerId = req.user?.id
        const content = await Content.findByPk(req.params.id)

        if (!content || content.trainerId !== trainerId) {
            return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404)
        }

        // Can only withdraw pending content
        if (content.status !== 'pending') {
            return err(res, {
                code: 'INVALID_STATUS',
                message: `Cannot withdraw content with status '${content.status}'`
            }, 400)
        }

        // Update status back to draft
        content.status = 'draft'
        await content.save()

        ok(res, content)
    } catch (error) {
        err(res, error)
    }
})

module.exports = router



