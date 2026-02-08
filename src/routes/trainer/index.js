'use strict'

const express = require('express')
const router = express.Router()
const { requireAuth } = require('../../middleware/auth')
const { requireTrainer } = require('../../middleware/requireTrainer')

// All trainer routes require auth + trainer role
router.use(requireAuth)
router.use(requireTrainer)

// Mount sub-routers
router.use('/content', require('./content'))
router.use('/upload', require('./upload'))
router.use('/workout-plans', require('./workout-plans'))
router.use('/challenges', require('./challenges'))
router.use('/settings', require('./settings'))
router.use('/site', require('./site'))
router.use('/', require('./profile')) // /me and future profile endpoints
router.use('/', require('./stats'))   // /stats

module.exports = router


