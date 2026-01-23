'use strict'

const express = require('express')
const router = express.Router()

// Import sub-routes
const { router: contentRouter } = require('./content')
const { router: workoutPlansRouter } = require('./workout-plans')
const { router: challengesRouter } = require('./challenges')
const { router: engagementRouter } = require('./engagement')
const { router: progressRouter } = require('./progress')
const { router: profileRouter } = require('./profile')
const { router: settingsRouter } = require('./settings')
const { router: dailyChallengesRouter } = require('./daily-challenges')
const { router: gamesRouter } = require('./games')
const { router: leaderboardRouter } = require('./leaderboard')
const medicalRouter = require('./medical')

// Mount routes
router.use('/content', contentRouter)
router.use('/workout-plans', workoutPlansRouter)
router.use('/challenges', challengesRouter)
router.use('/engagement', engagementRouter)
router.use('/progress', progressRouter)
router.use('/profile', profileRouter)
router.use('/settings', settingsRouter)
router.use('/daily-challenges', dailyChallengesRouter)
router.use('/games', gamesRouter)
router.use('/leaderboard', leaderboardRouter)
router.use('/medical', medicalRouter)

module.exports = router


