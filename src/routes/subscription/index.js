'use strict'

const express = require('express')
const router = express.Router()
const plansRoutes = require('./plans')
const userSubscriptionsRoutes = require('./user-subscriptions')

router.use('/plans', plansRoutes)
router.use('/', userSubscriptionsRoutes)

module.exports = router

