'use strict'

const express = require('express')
const router = express.Router()
const plansRoutes = require('./plans')
const email = require('./email')
const userSubscriptionsRoutes = require('./user-subscriptions')

router.use('/plans', plansRoutes)
router.use('/email', email)
router.use('/', userSubscriptionsRoutes)

module.exports = router

