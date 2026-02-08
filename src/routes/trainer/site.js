'use strict'

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { ok, err } = require('../../utils/errors')
const { TrainerSite, User } = require('../../models')

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.id
        const uploadDir = path.join(__dirname, '../../uploads/trainer-sites', String(userId))
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname || '')
        cb(null, unique + ext)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for images
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)

        if (mimetype && extname) {
            return cb(null, true)
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'))
        }
    }
})

// GET /trainer/site - Get trainer's site customization
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        let trainerSite = await TrainerSite.findOne({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name']
            }]
        })

        // Create default site if it doesn't exist
        if (!trainerSite) {
            trainerSite = await TrainerSite.create({
                userId,
                status: 'published',
                galleryImages: [],
                theme: {},
                sections: [],
                trainerContent: [],
                socialLinks: {},
                viewCount: 0
            })
        }

        ok(res, trainerSite)
    } catch (error) {
        console.error('Error fetching trainer site:', error)
        err(res, error)
    }
})

// PUT /trainer/site - Update trainer's site customization
router.put('/', async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const {
            slug,
            headline,
            subheadline,
            bio,
            philosophy,
            targetAudience,
            heroBackgroundImage,
            galleryImages,
            theme,
            sections,
            trainerContent,
            socialLinks,
            ctaText,
            status
        } = req.body

        // Validate status if provided
        if (status && !['draft', 'published', 'archived'].includes(status)) {
            return err(res, { code: 'BAD_REQUEST', message: 'Invalid status' }, 400)
        }

        // Check if slug is unique (if provided and different from current)
        if (slug && slug.trim()) {
            const { Op } = require('sequelize')
            const existingSite = await TrainerSite.findOne({
                where: {
                    slug: slug.trim(),
                    userId: { [Op.ne]: userId }
                }
            })
            if (existingSite) {
                return err(res, { code: 'CONFLICT', message: 'Slug already taken' }, 409)
            }
        }

        let trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            // Create new site
            trainerSite = await TrainerSite.create({
                userId,
                slug,
                headline,
                subheadline,
                bio,
                philosophy,
                targetAudience,
                heroBackgroundImage,
                galleryImages: galleryImages || [],
                theme: theme || {},
                sections: sections || [],
                trainerContent: trainerContent || [],
                socialLinks: socialLinks || {},
                ctaText,
                status: status || 'published',
                viewCount: 0
            })
        } else {
            // Update existing site
            const updateData = {}
            if (slug !== undefined) updateData.slug = slug && slug.trim() ? slug.trim() : null
            if (headline !== undefined) updateData.headline = headline
            if (subheadline !== undefined) updateData.subheadline = subheadline
            if (bio !== undefined) updateData.bio = bio
            if (philosophy !== undefined) updateData.philosophy = philosophy
            if (targetAudience !== undefined) updateData.targetAudience = targetAudience
            if (heroBackgroundImage !== undefined) updateData.heroBackgroundImage = heroBackgroundImage
            if (galleryImages !== undefined) updateData.galleryImages = galleryImages
            if (theme !== undefined) updateData.theme = theme
            if (sections !== undefined) updateData.sections = sections
            if (trainerContent !== undefined) updateData.trainerContent = trainerContent
            if (socialLinks !== undefined) updateData.socialLinks = socialLinks
            if (ctaText !== undefined) updateData.ctaText = ctaText
            if (status !== undefined) updateData.status = status

            await trainerSite.update(updateData)
        }

        // Reload to get fresh data
        trainerSite = await TrainerSite.findOne({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name']
            }]
        })

        ok(res, trainerSite)
    } catch (error) {
        console.error('Error updating trainer site:', error)
        err(res, error)
    }
})

// POST /trainer/site/gallery - Upload gallery image
router.post('/gallery', upload.single('image'), async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        if (!req.file) {
            return err(res, { code: 'BAD_REQUEST', message: 'No image uploaded' }, 400)
        }

        const publicUrl = `/api/v1/uploads/trainer-sites/${userId}/${req.file.filename}`

        let trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            trainerSite = await TrainerSite.create({
                userId,
                status: 'published',
                galleryImages: [],
                theme: {},
                sections: [],
                trainerContent: [],
                socialLinks: {},
                viewCount: 0
            })
        }

        const galleryImages = trainerSite.galleryImages || []
        const newImage = {
            id: Date.now().toString(),
            url: publicUrl,
            caption: req.body.caption || '',
            order: galleryImages.length
        }

        galleryImages.push(newImage)
        await trainerSite.update({ galleryImages })

        ok(res, { image: newImage, galleryImages })
    } catch (error) {
        console.error('Error uploading gallery image:', error)
        err(res, error)
    }
})

// PUT /trainer/site/gallery/:imageId - Update gallery image (caption, order)
router.put('/gallery/:imageId', async (req, res) => {
    try {
        const userId = req.user?.id
        const { imageId } = req.params
        const { caption, order } = req.body

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            return err(res, { code: 'NOT_FOUND', message: 'Trainer site not found' }, 404)
        }

        const galleryImages = trainerSite.galleryImages || []
        const imageIndex = galleryImages.findIndex(img => img.id === imageId)

        if (imageIndex === -1) {
            return err(res, { code: 'NOT_FOUND', message: 'Image not found' }, 404)
        }

        if (caption !== undefined) {
            galleryImages[imageIndex].caption = caption
        }
        if (order !== undefined) {
            galleryImages[imageIndex].order = order
            // Reorder all images
            galleryImages.sort((a, b) => (a.order || 0) - (b.order || 0))
        }

        await trainerSite.update({ galleryImages })

        ok(res, { galleryImages })
    } catch (error) {
        console.error('Error updating gallery image:', error)
        err(res, error)
    }
})

// DELETE /trainer/site/gallery/:imageId - Delete gallery image
router.delete('/gallery/:imageId', async (req, res) => {
    try {
        const userId = req.user?.id
        const { imageId } = req.params

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            return err(res, { code: 'NOT_FOUND', message: 'Trainer site not found' }, 404)
        }

        const galleryImages = trainerSite.galleryImages || []
        const filteredImages = galleryImages.filter(img => img.id !== imageId)

        if (filteredImages.length === galleryImages.length) {
            return err(res, { code: 'NOT_FOUND', message: 'Image not found' }, 404)
        }

        await trainerSite.update({ galleryImages: filteredImages })

        ok(res, { message: 'Image deleted', galleryImages: filteredImages })
    } catch (error) {
        console.error('Error deleting gallery image:', error)
        err(res, error)
    }
})

// POST /trainer/site/hero-background - Upload hero background image
router.post('/hero-background', upload.single('image'), async (req, res) => {
    try {
        const userId = req.user?.id

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        if (!req.file) {
            return err(res, { code: 'BAD_REQUEST', message: 'No image uploaded' }, 400)
        }

        const publicUrl = `/api/v1/uploads/trainer-sites/${userId}/${req.file.filename}`

        let trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            trainerSite = await TrainerSite.create({
                userId,
                status: 'published',
                galleryImages: [],
                theme: {},
                sections: [],
                trainerContent: [],
                socialLinks: {},
                viewCount: 0
            })
        }

        await trainerSite.update({ heroBackgroundImage: publicUrl })

        ok(res, { heroBackgroundImage: publicUrl })
    } catch (error) {
        console.error('Error uploading hero background:', error)
        err(res, error)
    }
})

// POST /trainer/site/trainer-content - Add trainer-authored content item
router.post('/trainer-content', async (req, res) => {
    try {
        const userId = req.user?.id
        const { title, description, url, type } = req.body

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        if (!title || !url || !type) {
            return err(res, { code: 'BAD_REQUEST', message: 'Title, URL, and type are required' }, 400)
        }

        if (!['article', 'video', 'post', 'reel'].includes(type)) {
            return err(res, { code: 'BAD_REQUEST', message: 'Invalid content type' }, 400)
        }

        let trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            trainerSite = await TrainerSite.create({
                userId,
                status: 'published',
                galleryImages: [],
                theme: {},
                sections: [],
                trainerContent: [],
                socialLinks: {},
                viewCount: 0
            })
        }

        const trainerContent = trainerSite.trainerContent || []
        const newContent = {
            id: Date.now().toString(),
            title,
            description: description || '',
            url,
            type,
            order: trainerContent.length
        }

        trainerContent.push(newContent)
        await trainerSite.update({ trainerContent })

        ok(res, { content: newContent, trainerContent })
    } catch (error) {
        console.error('Error adding trainer content:', error)
        err(res, error)
    }
})

// PUT /trainer/site/trainer-content/:id - Update trainer content item
router.put('/trainer-content/:id', async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params
        const { title, description, url, type, order } = req.body

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            return err(res, { code: 'NOT_FOUND', message: 'Trainer site not found' }, 404)
        }

        if (type && !['article', 'video', 'post', 'reel'].includes(type)) {
            return err(res, { code: 'BAD_REQUEST', message: 'Invalid content type' }, 400)
        }

        const trainerContent = trainerSite.trainerContent || []
        const contentIndex = trainerContent.findIndex(item => item.id === id)

        if (contentIndex === -1) {
            return err(res, { code: 'NOT_FOUND', message: 'Content item not found' }, 404)
        }

        if (title !== undefined) trainerContent[contentIndex].title = title
        if (description !== undefined) trainerContent[contentIndex].description = description
        if (url !== undefined) trainerContent[contentIndex].url = url
        if (type !== undefined) trainerContent[contentIndex].type = type
        if (order !== undefined) {
            trainerContent[contentIndex].order = order
            // Reorder all content
            trainerContent.sort((a, b) => (a.order || 0) - (b.order || 0))
        }

        await trainerSite.update({ trainerContent })

        ok(res, { trainerContent })
    } catch (error) {
        console.error('Error updating trainer content:', error)
        err(res, error)
    }
})

// DELETE /trainer/site/trainer-content/:id - Delete trainer content item
router.delete('/trainer-content/:id', async (req, res) => {
    try {
        const userId = req.user?.id
        const { id } = req.params

        if (!userId) {
            return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
        }

        const trainerSite = await TrainerSite.findOne({ where: { userId } })

        if (!trainerSite) {
            return err(res, { code: 'NOT_FOUND', message: 'Trainer site not found' }, 404)
        }

        const trainerContent = trainerSite.trainerContent || []
        const filteredContent = trainerContent.filter(item => item.id !== id)

        if (filteredContent.length === trainerContent.length) {
            return err(res, { code: 'NOT_FOUND', message: 'Content item not found' }, 404)
        }

        await trainerSite.update({ trainerContent: filteredContent })

        ok(res, { message: 'Content deleted', trainerContent: filteredContent })
    } catch (error) {
        console.error('Error deleting trainer content:', error)
        err(res, error)
    }
})

module.exports = router

