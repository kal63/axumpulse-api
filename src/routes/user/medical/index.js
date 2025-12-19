'use strict'

const express = require('express')
const router = express.Router()
const { requireAuth } = require('../../../middleware')
const { ok, err } = require('../../../utils/errors')
const { getPagination, executePaginatedQuery } = require('../../../utils/pagination')
const {
  UserMedicalProfile,
  IntakeForm,
  IntakeResponse,
  TriageRun,
  MedicalQuestion,
  ConsultSlot,
  ConsultBooking,
  ConsultNote,
  HealthDataPoint,
  HealthDataRollup,
  HealthAlert,
  User
} = require('../../../models')
const { Op } = require('sequelize')
const { evaluateTriageRules } = require('../../../utils/triageEngine')

// All routes require authentication
router.use(requireAuth)

// GET /api/v1/user/medical/profile - Get user's medical profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    let profile = await UserMedicalProfile.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name'] }]
    })

    if (!profile) {
      // Create empty profile if doesn't exist
      profile = await UserMedicalProfile.create({
        userId,
        conditions: [],
        medications: [],
        allergies: [],
        surgeries: [],
        contraindications: []
      })
    }

    ok(res, profile)
  } catch (error) {
    console.error('Error fetching medical profile:', error)
    err(res, error)
  }
})

// PUT /api/v1/user/medical/profile - Update medical profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const {
      conditions,
      medications,
      allergies,
      surgeries,
      pregnancyStatus,
      contraindications,
      notes
    } = req.body

    let profile = await UserMedicalProfile.findOne({ where: { userId } })

    if (!profile) {
      profile = await UserMedicalProfile.create({
        userId,
        conditions: conditions || [],
        medications: medications || [],
        allergies: allergies || [],
        surgeries: surgeries || [],
        pregnancyStatus: pregnancyStatus || null,
        contraindications: contraindications || [],
        notes: notes || null,
        updatedBy: userId
      })
    } else {
      await profile.update({
        conditions: conditions !== undefined ? conditions : profile.conditions,
        medications: medications !== undefined ? medications : profile.medications,
        allergies: allergies !== undefined ? allergies : profile.allergies,
        surgeries: surgeries !== undefined ? surgeries : profile.surgeries,
        pregnancyStatus: pregnancyStatus !== undefined ? pregnancyStatus : profile.pregnancyStatus,
        contraindications: contraindications !== undefined ? contraindications : profile.contraindications,
        notes: notes !== undefined ? notes : profile.notes,
        updatedBy: userId
      })
    }

    ok(res, profile)
  } catch (error) {
    console.error('Error updating medical profile:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/intake-forms - List available intake forms
router.get('/intake-forms', async (req, res) => {
  try {
    const forms = await IntakeForm.findAll({
      where: { status: 'published' },
      order: [['publishedAt', 'DESC']]
    })

    ok(res, forms)
  } catch (error) {
    console.error('Error fetching intake forms:', error)
    err(res, error)
  }
})

// POST /api/v1/user/medical/intake - Submit intake form (triggers triage)
router.post('/intake', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { formId, answers } = req.body

    if (!formId || !answers) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'formId and answers are required' }, 400)
    }

    // Verify form exists and is published
    const form = await IntakeForm.findOne({
      where: { id: formId, status: 'published' }
    })

    if (!form) {
      return err(res, { code: 'NOT_FOUND', message: 'Intake form not found or not published' }, 404)
    }

    // Create intake response
    const response = await IntakeResponse.create({
      userId,
      formId,
      answers
    })

    // Get user medical profile for triage
    const medicalProfile = await UserMedicalProfile.findOne({ where: { userId } })

    // Run triage evaluation
    const triageResult = await evaluateTriageRules(response, medicalProfile)

    ok(res, {
      intakeResponse: response,
      triageRun: triageResult
    })
  } catch (error) {
    console.error('Error submitting intake:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/triage-runs - Get user's triage history
router.get('/triage-runs', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      TriageRun,
      {
        where: { userId },
        order: [['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching triage runs:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/triage-runs/:id - Get specific triage run details
router.get('/triage-runs/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const triageRun = await TriageRun.findOne({
      where: { id, userId },
      include: [
        { model: IntakeResponse, as: 'intakeResponse', include: [{ model: IntakeForm, as: 'form' }] }
      ]
    })

    if (!triageRun) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage run not found' }, 404)
    }

    ok(res, triageRun)
  } catch (error) {
    console.error('Error fetching triage run:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/questions - List user's questions
router.get('/questions', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      MedicalQuestion,
      {
        where: { userId },
        include: [
          {
            model: MedicalQuestion.associations.answers.target,
            as: 'answers',
            include: [{ model: User, as: 'responder', attributes: ['id', 'name'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching questions:', error)
    err(res, error)
  }
})

// POST /api/v1/user/medical/questions - Submit new question
router.post('/questions', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { text, tags, triageRunId } = req.body

    if (!text) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Question text is required' }, 400)
    }

    const question = await MedicalQuestion.create({
      userId,
      text,
      tags: tags || [],
      triageRunId: triageRunId || null,
      status: 'open'
    })

    ok(res, question)
  } catch (error) {
    console.error('Error creating question:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/questions/:id - Get question with answers
router.get('/questions/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const question = await MedicalQuestion.findOne({
      where: { id, userId },
      include: [
        {
          model: MedicalQuestion.associations.answers.target,
          as: 'answers',
          include: [{ model: User, as: 'responder', attributes: ['id', 'name'] }]
        },
        { model: TriageRun, as: 'triageRun' }
      ]
    })

    if (!question) {
      return err(res, { code: 'NOT_FOUND', message: 'Question not found' }, 404)
    }

    ok(res, question)
  } catch (error) {
    console.error('Error fetching question:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/slots - List available consult slots
router.get('/consults/slots', async (req, res) => {
  try {
    const { providerId, type, startDate, endDate } = req.query

    const where = {
      status: 'open'
    }

    if (providerId) where.providerId = providerId
    if (type) where.type = type
    if (startDate || endDate) {
      where.startAt = {}
      if (startDate) where.startAt[Op.gte] = new Date(startDate)
      if (endDate) where.startAt[Op.lte] = new Date(endDate)
    }

    const slots = await ConsultSlot.findAll({
      where,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name', 'profilePicture'],
          include: [
            {
              model: require('../../../models').MedicalProfessional,
              as: 'medicalProfessional',
              attributes: ['professionalType', 'specialties', 'verified']
            }
          ]
        }
      ],
      order: [['startAt', 'ASC']]
    })

    ok(res, slots)
  } catch (error) {
    console.error('Error fetching consult slots:', error)
    err(res, error)
  }
})

// POST /api/v1/user/medical/consults/bookings - Book a consult
router.post('/consults/bookings', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { slotId } = req.body

    if (!slotId) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'slotId is required' }, 400)
    }

    // Check if slot exists and is available
    const slot = await ConsultSlot.findOne({
      where: { id: slotId, status: 'open' },
      include: [{ model: ConsultBooking, as: 'booking' }]
    })

    if (!slot) {
      return err(res, { code: 'NOT_FOUND', message: 'Slot not found or not available' }, 404)
    }

    if (slot.booking) {
      return err(res, { code: 'ALREADY_BOOKED', message: 'Slot is already booked' }, 400)
    }

    // Create booking
    const booking = await ConsultBooking.create({
      userId,
      slotId,
      status: 'booked'
    })

    // Mark slot as closed
    await slot.update({ status: 'closed' })

    const bookingWithDetails = await ConsultBooking.findByPk(booking.id, {
      include: [
        { model: ConsultSlot, as: 'slot', include: [{ model: User, as: 'provider', attributes: ['id', 'name', 'profilePicture'] }] },
        { model: User, as: 'user', attributes: ['id', 'name'] }
      ]
    })

    ok(res, bookingWithDetails)
  } catch (error) {
    console.error('Error booking consult:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/bookings - List user's bookings
router.get('/consults/bookings', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      ConsultBooking,
      {
        where: { userId },
        include: [
          {
            model: ConsultSlot,
            as: 'slot',
            include: [{ model: User, as: 'provider', attributes: ['id', 'name', 'profilePicture'] }]
          }
        ],
        order: [['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/bookings/:id - Get booking details
router.get('/consults/bookings/:id', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const booking = await ConsultBooking.findOne({
      where: { id, userId },
      include: [
        {
          model: ConsultSlot,
          as: 'slot',
          include: [{ model: User, as: 'provider', attributes: ['id', 'name', 'profilePicture'] }]
        },
        { model: ConsultNote, as: 'note' }
      ]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    ok(res, booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    err(res, error)
  }
})

// PATCH /api/v1/user/medical/consults/bookings/:id/cancel - Cancel booking
router.patch('/consults/bookings/:id/cancel', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    const { cancelReason } = req.body

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const booking = await ConsultBooking.findOne({
      where: { id, userId },
      include: [{ model: ConsultSlot, as: 'slot' }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    if (booking.status === 'canceled' || booking.status === 'completed') {
      return err(res, { code: 'INVALID_STATUS', message: 'Cannot cancel booking in current status' }, 400)
    }

    await booking.update({
      status: 'canceled',
      canceledAt: new Date(),
      cancelReason: cancelReason || null
    })

    // Reopen slot if canceled
    if (booking.slot) {
      await booking.slot.update({ status: 'open' })
    }

    ok(res, booking)
  } catch (error) {
    console.error('Error canceling booking:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/notes/:bookingId - Get consult summary/notes (if shared)
router.get('/consults/notes/:bookingId', async (req, res) => {
  try {
    const userId = req.user?.id
    const { bookingId } = req.params

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const booking = await ConsultBooking.findOne({
      where: { id: bookingId, userId }
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    const note = await ConsultNote.findOne({
      where: { bookingId, summaryShared: true }
    })

    if (!note) {
      return err(res, { code: 'NOT_FOUND', message: 'Consult summary not available' }, 404)
    }

    ok(res, note)
  } catch (error) {
    console.error('Error fetching consult notes:', error)
    err(res, error)
  }
})

// POST /api/v1/user/medical/health-data - Log health data point
router.post('/health-data', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { metric, value, unit, source, capturedAt } = req.body

    if (!metric || value === undefined) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'metric and value are required' }, 400)
    }

    const dataPoint = await HealthDataPoint.create({
      userId,
      metric,
      value,
      unit: unit || null,
      source: source || null,
      capturedAt: capturedAt ? new Date(capturedAt) : new Date()
    })

    ok(res, dataPoint)
  } catch (error) {
    console.error('Error creating health data point:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/health-data - Get health data with filters
router.get('/health-data', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { metric, startDate, endDate } = req.query

    const where = { userId }
    if (metric) where.metric = metric
    if (startDate || endDate) {
      where.capturedAt = {}
      if (startDate) where.capturedAt[Op.gte] = new Date(startDate)
      if (endDate) where.capturedAt[Op.lte] = new Date(endDate)
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      HealthDataPoint,
      {
        where,
        order: [['capturedAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching health data:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/health-data/rollups - Get aggregated health data
router.get('/health-data/rollups', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { metric, period = 'daily', startDate, endDate } = req.query

    const where = { userId }
    if (metric) where.metric = metric
    if (startDate || endDate) {
      where.periodDate = {}
      if (startDate) where.periodDate[Op.gte] = startDate
      if (endDate) where.periodDate[Op.lte] = endDate
    }

    const rollups = await HealthDataRollup.findAll({
      where,
      order: [['periodDate', 'DESC']]
    })

    ok(res, rollups)
  } catch (error) {
    console.error('Error fetching health data rollups:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/alerts - Get user's health alerts
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      HealthAlert,
      {
        where: { userId },
        order: [['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching alerts:', error)
    err(res, error)
  }
})

module.exports = router

