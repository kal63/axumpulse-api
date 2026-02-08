'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const { Language } = require('../../models')
const requireAuth = require('../../middleware/auth').requireAuth

// All routes require authentication
router.use(requireAuth)

// GET /api/v1/user/languages - Get all active languages
router.get('/', async (req, res) => {
    try {
        const languages = await Language.findAll({
            where: {
                isActive: true
            },
            order: [['name', 'ASC']]
        })
        
        ok(res, languages)
    } catch (error) {
        console.error('Error fetching languages:', error)
        err(res, error)
    }
})

module.exports = router

