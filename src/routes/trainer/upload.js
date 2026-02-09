'use strict'

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { ok, err } = require('../../utils/errors')

const storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        const dir = path.join(__dirname, '..', '..', 'uploads')
        fs.mkdirSync(dir, { recursive: true })
        cb(null, dir)
    },
    filename: function (_req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname || '')
        cb(null, unique + ext)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 500 * 1024 * 1024, // 500MB limit for content (videos, etc.)
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for content uploads
        cb(null, true)
    }
})

// Separate storage for trainer site images
const trainerSiteImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.user?.id
        const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'trainer-sites', String(userId))
        fs.mkdirSync(uploadDir, { recursive: true })
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname || '')
        cb(null, unique + ext)
    }
})

const trainerSiteImageUpload = multer({
    storage: trainerSiteImageStorage,
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

// POST /trainer/upload/content
router.post('/content', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return err(res, { code: 'BAD_REQUEST', message: 'No file uploaded' }, 400)
        const publicUrl = `/uploads/${req.file.filename}`
        ok(res, { url: publicUrl, originalName: req.file.originalname })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/upload/thumbnail
router.post('/thumbnail', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return err(res, { code: 'BAD_REQUEST', message: 'No thumbnail uploaded' }, 400)
        const publicUrl = `/uploads/${req.file.filename}`
        ok(res, { url: publicUrl, originalName: req.file.originalname })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/upload/gallery-image - Upload gallery image for trainer site
router.post('/gallery-image', trainerSiteImageUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return err(res, { code: 'BAD_REQUEST', message: 'No image uploaded' }, 400)
        const userId = req.user?.id
        const publicUrl = `/api/v1/uploads/trainer-sites/${userId}/${req.file.filename}`
        ok(res, { url: publicUrl, originalName: req.file.originalname })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/upload/hero-background - Upload hero background for trainer site
router.post('/hero-background', trainerSiteImageUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return err(res, { code: 'BAD_REQUEST', message: 'No image uploaded' }, 400)
        const userId = req.user?.id
        const publicUrl = `/api/v1/uploads/trainer-sites/${userId}/${req.file.filename}`
        ok(res, { url: publicUrl, originalName: req.file.originalname })
    } catch (error) {
        err(res, error)
    }
})

module.exports = router



