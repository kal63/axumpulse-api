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
        fileSize: 100 * 1024 * 1024, // 100MB limit for content (videos, etc.)
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types for content uploads
        cb(null, true)
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

module.exports = router



