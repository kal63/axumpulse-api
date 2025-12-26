'use strict'

const express = require('express')
const router = express.Router()
const { requireAuth, requireMedical } = require('../../middleware')
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQuery, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination')
const {
  TriageRule,
  TriageRun,
  MedicalQuestion,
  MedicalAnswer,
  ConsultSchedule,
  ConsultSlot,
  ConsultBooking,
  ConsultNote,
  HealthAlert,
  User,
  UserMedicalProfile,
  MedicalProfessional,
  IntakeResponse,
  IntakeForm
} = require('../../models')
const { Op } = require('sequelize')

// All routes require authentication and medical professional role
router.use(requireAuth)
router.use(requireMedical)

// GET /api/v1/medical/dashboard - Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const medicalProId = req.user?.id

    const [pendingQuestions, upcomingConsults, openAlerts, pendingTriage] = await Promise.all([
      MedicalQuestion.count({ where: { status: 'open' } }),
      ConsultBooking.count({
        where: { status: 'booked' },
        include: [{ model: ConsultSlot, as: 'slot', where: { providerId: medicalProId } }]
      }),
      HealthAlert.count({ where: { status: 'open', assignedTo: medicalProId } }),
      TriageRun.count({ where: { disposition: 'book_consult', riskLevel: { [Op.in]: ['high', 'critical'] } } })
    ])

    ok(res, {
      pendingQuestions,
      upcomingConsults,
      openAlerts,
      pendingTriage
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/triage-queue - List triage runs needing review
router.get('/triage-queue', async (req, res) => {
  try {
    const { disposition, riskLevel } = req.query

    const where = {}
    if (disposition) where.disposition = disposition
    if (riskLevel) where.riskLevel = riskLevel
    // Default: show high/critical risk or those needing consult
    if (!disposition && !riskLevel) {
      where[Op.or] = [
        { riskLevel: { [Op.in]: ['high', 'critical'] } },
        { disposition: 'book_consult' }
      ]
    }

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      TriageRun,
      {
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: IntakeResponse, as: 'intakeResponse', include: [{ model: require('../../models').IntakeForm, as: 'form' }] }
        ],
        order: [['riskLevel', 'DESC'], ['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching triage queue:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/triage-runs/:id - Get triage run details
router.get('/triage-runs/:id', async (req, res) => {
  try {
    const { id } = req.params

    const triageRun = await TriageRun.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        { model: IntakeResponse, as: 'intakeResponse', include: [{ model: require('../../models').IntakeForm, as: 'form' }] }
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

// PUT /api/v1/medical/triage-runs/:id/review - Review/update triage disposition
router.put('/triage-runs/:id/review', async (req, res) => {
  try {
    const { id } = req.params
    const { riskLevel, disposition, messages } = req.body
    const medicalProId = req.user?.id

    if (!riskLevel || !disposition) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'riskLevel and disposition are required' }, 400)
    }

    const triageRun = await TriageRun.findByPk(id)

    if (!triageRun) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage run not found' }, 404)
    }

    await triageRun.update({
      riskLevel,
      disposition,
      messages: messages || triageRun.messages,
      createdByType: 'medical',
      createdBy: medicalProId
    })

    ok(res, triageRun)
  } catch (error) {
    console.error('Error reviewing triage run:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/questions - Q&A inbox
router.get('/questions', async (req, res) => {
  try {
    const { status, assigned } = req.query

    const where = {}
    if (status) where.status = status

    const pagination = getPagination(req.query)

    const result = await executePaginatedQueryWithSeparateCount(
      MedicalQuestion,
      {
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          {
            model: MedicalAnswer,
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

// GET /api/v1/medical/questions/:id - Get question with history
router.get('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params

    const question = await MedicalQuestion.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name'] },
        {
          model: MedicalAnswer,
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

// POST /api/v1/medical/questions/:id/answers - Answer a question
router.post('/questions/:id/answers', async (req, res) => {
  try {
    const { id } = req.params
    const { text, visibility } = req.body
    const responderId = req.user?.id

    if (!text) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Answer text is required' }, 400)
    }

    const question = await MedicalQuestion.findByPk(id)

    if (!question) {
      return err(res, { code: 'NOT_FOUND', message: 'Question not found' }, 404)
    }

    const answer = await MedicalAnswer.create({
      questionId: id,
      responderId,
      text,
      visibility: visibility || 'user'
    })

    // Update question status
    await question.update({ status: 'answered' })

    const answerWithResponder = await MedicalAnswer.findByPk(answer.id, {
      include: [{ model: User, as: 'responder', attributes: ['id', 'name'] }]
    })

    ok(res, answerWithResponder)
  } catch (error) {
    console.error('Error creating answer:', error)
    err(res, error)
  }
})

// ==================== CONSULT SCHEDULES (Weekly Recurring) ====================

// GET /api/v1/medical/consults/schedules - List all weekly schedules for the logged-in provider
router.get('/consults/schedules', async (req, res) => {
  try {
    const providerId = req.user?.id

    const schedules = await ConsultSchedule.findAll({
      where: { providerId },
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    })

    ok(res, schedules)
  } catch (error) {
    console.error('Error fetching schedules:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/consults/schedules - Create weekly schedule entry
router.post('/consults/schedules', async (req, res) => {
  try {
    const providerId = req.user?.id
    let { dayOfWeek, startTime, endTime, duration, type, timezone, status } = req.body

    if (dayOfWeek === undefined || !startTime || !endTime) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'dayOfWeek, startTime, and endTime are required' }, 400)
    }

    // Convert dayOfWeek to number if it's a string
    dayOfWeek = parseInt(dayOfWeek)

    // Validate dayOfWeek
    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' }, 400)
    }

    // Normalize time format: ensure HH:MM:SS format (convert HH:MM to HH:MM:SS)
    if (typeof startTime === 'string' && startTime.length === 5) {
      startTime = startTime + ':00'
    }
    if (typeof endTime === 'string' && endTime.length === 5) {
      endTime = endTime + ':00'
    }

    // Validate type enum
    const validTypes = ['quick', 'full', 'follow_up']
    if (type && !validTypes.includes(type)) {
      return err(res, { 
        code: 'VALIDATION_ERROR', 
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      }, 400)
    }

    // Validate duration
    if (duration !== undefined) {
      duration = parseInt(duration)
      if (isNaN(duration) || duration < 1) {
        return err(res, { code: 'VALIDATION_ERROR', message: 'duration must be at least 1 minute' }, 400)
      }
    }

    const schedule = await ConsultSchedule.create({
      providerId,
      dayOfWeek,
      startTime,
      endTime,
      duration: duration || 30,
      type: type || 'quick',
      timezone: timezone || null,
      status: status || 'active'
    })

    ok(res, schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors,
      stack: error.stack
    })
    console.error('Request body:', req.body)
    
    let errorMessage = 'An unexpected error occurred.'
    let statusCode = 400
    
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors?.map(e => e.message).join(', ') || 'Validation error'
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'A schedule with this time range already exists for this day'
      statusCode = 409
    } else if (error.message) {
      errorMessage = error.message
    }
    
    err(res, { 
      code: error.name || 'VALIDATION_ERROR', 
      message: errorMessage,
      details: error.errors || {}
    }, statusCode)
  }
})

// PUT /api/v1/medical/consults/schedules/:id - Update a schedule entry
router.put('/consults/schedules/:id', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params
    const { dayOfWeek, startTime, endTime, duration, type, timezone, status } = req.body

    const schedule = await ConsultSchedule.findOne({
      where: { id, providerId }
    })

    if (!schedule) {
      return err(res, { code: 'NOT_FOUND', message: 'Schedule not found' }, 404)
    }

    // Validate type if provided
    if (type) {
      const validTypes = ['quick', 'full', 'follow_up']
      if (!validTypes.includes(type)) {
        return err(res, { 
          code: 'VALIDATION_ERROR', 
          message: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
        }, 400)
      }
    }

    // Normalize time format if provided: ensure HH:MM:SS format
    let normalizedStartTime
    let normalizedEndTime
    if (startTime !== undefined && startTime !== null) {
      if (typeof startTime === 'string' && startTime.length === 5) {
        normalizedStartTime = startTime + ':00'
      } else {
        normalizedStartTime = startTime
      }
    }
    if (endTime !== undefined && endTime !== null) {
      if (typeof endTime === 'string' && endTime.length === 5) {
        normalizedEndTime = endTime + ':00'
      } else {
        normalizedEndTime = endTime
      }
    }

    // Validate duration if provided
    let normalizedDuration
    if (duration !== undefined && duration !== null) {
      normalizedDuration = parseInt(duration)
      if (isNaN(normalizedDuration) || normalizedDuration < 1) {
        return err(res, { code: 'VALIDATION_ERROR', message: 'duration must be at least 1 minute' }, 400)
      }
    }

    // Build update object - only include fields that are provided
    const updateData = {}
    if (dayOfWeek !== undefined) {
      updateData.dayOfWeek = parseInt(dayOfWeek)
      if (isNaN(updateData.dayOfWeek) || updateData.dayOfWeek < 0 || updateData.dayOfWeek > 6) {
        return err(res, { code: 'VALIDATION_ERROR', message: 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)' }, 400)
      }
    }
    if (normalizedStartTime !== undefined) {
      updateData.startTime = normalizedStartTime
    }
    if (normalizedEndTime !== undefined) {
      updateData.endTime = normalizedEndTime
    }
    if (normalizedDuration !== undefined) {
      updateData.duration = normalizedDuration
    }
    if (type !== undefined) {
      updateData.type = type
    }
    if (timezone !== undefined) {
      updateData.timezone = timezone
    }
    if (status !== undefined) {
      updateData.status = status
    }

    await schedule.update(updateData)

    ok(res, schedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    })
    
    let errorMessage = 'An unexpected error occurred.'
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors?.map(e => e.message).join(', ') || 'Validation error'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    err(res, { 
      code: 'VALIDATION_ERROR', 
      message: errorMessage,
      details: error.errors || {}
    }, 400)
  }
})

// DELETE /api/v1/medical/consults/schedules/:id - Delete a schedule entry
router.delete('/consults/schedules/:id', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const schedule = await ConsultSchedule.findOne({
      where: { id, providerId }
    })

    if (!schedule) {
      return err(res, { code: 'NOT_FOUND', message: 'Schedule not found' }, 404)
    }

    await schedule.destroy()

    ok(res, { deleted: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/consults/slots - List my published slots
router.get('/consults/slots', async (req, res) => {
  try {
    const providerId = req.user?.id

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      ConsultSlot,
      {
        where: { providerId },
        include: [{ model: ConsultBooking, as: 'booking', include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] }],
        order: [['startAt', 'ASC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching slots:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/consults/slots - Create/publish new slot
router.post('/consults/slots', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { startAt, endAt, type, timezone } = req.body

    if (!startAt || !endAt || !type) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'startAt, endAt, and type are required' }, 400)
    }

    // Validate type enum
    const validTypes = ['quick', 'full', 'follow_up']
    if (!validTypes.includes(type)) {
      return err(res, { 
        code: 'VALIDATION_ERROR', 
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      }, 400)
    }

    // Validate dates
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    
    if (isNaN(startDate.getTime())) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid startAt date format' }, 400)
    }
    
    if (isNaN(endDate.getTime())) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid endAt date format' }, 400)
    }

    if (endDate <= startDate) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'endAt must be after startAt' }, 400)
    }

    const slot = await ConsultSlot.create({
      providerId,
      startAt: startDate,
      endAt: endDate,
      type,
      timezone: timezone || null,
      status: 'open'
    })

    ok(res, slot)
  } catch (error) {
    console.error('Error creating slot:', error)
    
    // Provide more detailed error message
    let errorMessage = 'An unexpected error occurred.'
    if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors?.map(e => e.message).join(', ') || 'Validation error'
    } else if (error.name === 'SequelizeDatabaseError') {
      errorMessage = 'Database error occurred'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    err(res, { 
      code: 'VALIDATION_ERROR', 
      message: errorMessage,
      details: error.errors || {}
    }, 400)
  }
})

// PUT /api/v1/medical/consults/slots/:id - Update slot
router.put('/consults/slots/:id', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params
    const { startAt, endAt, type, timezone, status } = req.body

    const slot = await ConsultSlot.findOne({
      where: { id, providerId },
      include: [{ model: ConsultBooking, as: 'booking' }]
    })

    if (!slot) {
      return err(res, { code: 'NOT_FOUND', message: 'Slot not found' }, 404)
    }

    if (slot.booking && (startAt || endAt)) {
      return err(res, { code: 'INVALID_OPERATION', message: 'Cannot modify booked slot times' }, 400)
    }

    await slot.update({
      startAt: startAt ? new Date(startAt) : slot.startAt,
      endAt: endAt ? new Date(endAt) : slot.endAt,
      type: type || slot.type,
      timezone: timezone !== undefined ? timezone : slot.timezone,
      status: status || slot.status
    })

    ok(res, slot)
  } catch (error) {
    console.error('Error updating slot:', error)
    err(res, error)
  }
})

// DELETE /api/v1/medical/consults/slots/:id - Delete/cancel slot
router.delete('/consults/slots/:id', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const slot = await ConsultSlot.findOne({
      where: { id, providerId },
      include: [{ model: ConsultBooking, as: 'booking' }]
    })

    if (!slot) {
      return err(res, { code: 'NOT_FOUND', message: 'Slot not found' }, 404)
    }

    if (slot.booking) {
      return err(res, { code: 'INVALID_OPERATION', message: 'Cannot delete booked slot' }, 400)
    }

    await slot.destroy()

    ok(res, { message: 'Slot deleted successfully' })
  } catch (error) {
    console.error('Error deleting slot:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/consults/bookings - List bookings for my slots
router.get('/consults/bookings', async (req, res) => {
  try {
    const providerId = req.user?.id

    const pagination = getPagination(req.query)

    const result = await executePaginatedQueryWithSeparateCount(
      ConsultBooking,
      {
        include: [
          {
            model: ConsultSlot,
            as: 'slot',
            where: { providerId },
            required: true
          },
          { model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }
        ],
        order: [[{ model: ConsultSlot, as: 'slot' }, 'startAt', 'ASC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/consults/bookings/:id - Get booking with user medical profile
router.get('/consults/bookings/:id', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [
        {
          model: ConsultSlot,
          as: 'slot',
          where: { providerId },
          required: true
        },
        { model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] },
        { model: ConsultNote, as: 'note' }
      ]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    // Get user medical profile
    const medicalProfile = await UserMedicalProfile.findOne({
      where: { userId: booking.userId }
    })

    ok(res, {
      booking,
      medicalProfile
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/consults/bookings/:id/notes - Create/update consult notes
router.post('/consults/bookings/:id/notes', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params
    const { soap, diagnoses, recommendations, followUps, constraints } = req.body

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    let note = await ConsultNote.findOne({ where: { bookingId: id } })

    if (note) {
      await note.update({
        soap: soap || note.soap,
        diagnoses: diagnoses !== undefined ? diagnoses : note.diagnoses,
        recommendations: recommendations !== undefined ? recommendations : note.recommendations,
        followUps: followUps !== undefined ? followUps : note.followUps,
        constraints: constraints !== undefined ? constraints : note.constraints
      })
    } else {
      note = await ConsultNote.create({
        bookingId: id,
        providerId,
        soap: soap || {},
        diagnoses: diagnoses || [],
        recommendations: recommendations || [],
        followUps: followUps || [],
        constraints: constraints || {}
      })
    }

    // Mark booking as completed when notes are saved (if not already canceled)
    if (booking.status === 'booked') {
      await booking.update({ status: 'completed' })
    }

    ok(res, note)
  } catch (error) {
    console.error('Error creating/updating consult notes:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/consults/bookings/:id/notes - Get consult notes
router.get('/consults/bookings/:id/notes', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    const note = await ConsultNote.findOne({ where: { bookingId: id } })

    if (!note) {
      return err(res, { code: 'NOT_FOUND', message: 'Consult notes not found' }, 404)
    }

    ok(res, note)
  } catch (error) {
    console.error('Error fetching consult notes:', error)
    err(res, error)
  }
})

// PUT /api/v1/medical/consults/bookings/:id/complete - Mark consult as completed
router.put('/consults/bookings/:id/complete', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    if (booking.status === 'canceled') {
      return err(res, { code: 'INVALID_OPERATION', message: 'Cannot complete a canceled booking' }, 400)
    }

    await booking.update({ status: 'completed' })

    ok(res, booking)
  } catch (error) {
    console.error('Error completing booking:', error)
    err(res, error)
  }
})

// PUT /api/v1/medical/consults/bookings/:id/share-summary - Share summary with user
router.put('/consults/bookings/:id/share-summary', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    const note = await ConsultNote.findOne({ where: { bookingId: id } })

    if (!note) {
      return err(res, { code: 'NOT_FOUND', message: 'Consult notes not found' }, 404)
    }

    await note.update({
      summaryShared: true,
      summaryVersion: note.summaryVersion + 1
    })

    ok(res, note)
  } catch (error) {
    console.error('Error sharing summary:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/consults/bookings/:id/start-call - Start a call for a booking
router.post('/consults/bookings/:id/start-call', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    if (booking.status !== 'booked') {
      return err(res, { code: 'INVALID_STATUS', message: 'Can only start call for booked consultations' }, 400)
    }

    // Generate or reuse room ID
    let roomId = booking.callRoomId
    if (!roomId) {
      const { v4: uuidv4 } = require('uuid')
      roomId = uuidv4()
      await booking.update({ callRoomId: roomId })
    }

    // Update call status
    await booking.update({
      callStatus: 'ringing',
      callStartedAt: new Date()
    })

    ok(res, {
      bookingId: booking.id,
      roomId,
      callStatus: 'ringing',
      message: 'Call room created. Waiting for user to join.'
    })
  } catch (error) {
    console.error('Error starting call:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/consults/bookings/:id/call-status - Get call status
router.get('/consults/bookings/:id/call-status', async (req, res) => {
  try {
    const providerId = req.user?.id
    const { id } = req.params

    const booking = await ConsultBooking.findOne({
      where: { id },
      include: [{ model: ConsultSlot, as: 'slot', where: { providerId }, required: true }]
    })

    if (!booking) {
      return err(res, { code: 'NOT_FOUND', message: 'Booking not found' }, 404)
    }

    ok(res, {
      bookingId: booking.id,
      callStatus: booking.callStatus,
      callRoomId: booking.callRoomId,
      callStartedAt: booking.callStartedAt,
      callEndedAt: booking.callEndedAt
    })
  } catch (error) {
    console.error('Error fetching call status:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/alerts - List health alerts
router.get('/alerts', async (req, res) => {
  try {
    const { severity, assigned, status } = req.query

    const where = {}
    if (severity) where.severity = severity
    if (assigned === 'me') where.assignedTo = req.user?.id
    if (assigned === 'unassigned') where.assignedTo = null
    if (status) where.status = status

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      HealthAlert,
      {
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name'] },
          { model: User, as: 'assignee', attributes: ['id', 'name'], required: false }
        ],
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

// PUT /api/v1/medical/alerts/:id/ack - Acknowledge/resolve alert
router.put('/alerts/:id/ack', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const alert = await HealthAlert.findByPk(id)

    if (!alert) {
      return err(res, { code: 'NOT_FOUND', message: 'Alert not found' }, 404)
    }

    await alert.update({
      status: status || 'ack',
      assignedTo: alert.assignedTo || req.user?.id
    })

    ok(res, alert)
  } catch (error) {
    console.error('Error acknowledging alert:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/clients - List clients (only those who have booked with this provider)
router.get('/clients', async (req, res) => {
  try {
    const providerId = req.user?.id
    const pagination = getPagination(req.query)

    // Find all slots created by this provider
    const slots = await ConsultSlot.findAll({
      where: { providerId },
      attributes: ['id']
    })
    const slotIds = slots.map(slot => slot.id)

    // If no slots exist, return empty result
    if (slotIds.length === 0) {
      return ok(res, {
        items: [],
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0
      })
    }

    // Find all bookings for these slots to get unique user IDs
    const bookings = await ConsultBooking.findAll({
      where: { slotId: { [Op.in]: slotIds } },
      attributes: ['userId'],
      raw: true
    })
    // Get unique user IDs using Set
    const userIds = [...new Set(bookings.map(booking => booking.userId).filter(id => id != null))]

    // If no bookings exist, return empty result
    if (userIds.length === 0) {
      return ok(res, {
        items: [],
        total: 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: 0
      })
    }

    // Filter UserMedicalProfile to only include users who have booked with this provider
    const result = await executePaginatedQuery(
      UserMedicalProfile,
      {
        where: { userId: { [Op.in]: userIds } },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }],
        order: [['updatedAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching clients:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/clients/:userId - Get client summary
router.get('/clients/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const [medicalProfile, healthDataRollups, recentAlerts, recentConsults, intakeResponses] = await Promise.all([
      UserMedicalProfile.findOne({
        where: { userId },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'profilePicture'] }]
      }),
      require('../../models').HealthDataRollup.findAll({
        where: { userId },
        limit: 30,
        order: [['periodDate', 'DESC']]
      }),
      HealthAlert.findAll({
        where: { userId },
        limit: 10,
        order: [['createdAt', 'DESC']]
      }),
      ConsultBooking.findAll({
        where: { userId },
        include: [
          { model: ConsultSlot, as: 'slot', include: [{ model: User, as: 'provider', attributes: ['id', 'name'] }] },
          { model: ConsultNote, as: 'note' }
        ],
        limit: 10,
        order: [['createdAt', 'DESC']]
      }),
      IntakeResponse.findAll({
        where: { userId },
        include: [
          { model: IntakeForm, as: 'form', attributes: ['id', 'version', 'schema', 'status'] },
          { 
            model: TriageRun, 
            as: 'triageRuns', 
            attributes: ['id', 'riskLevel', 'disposition', 'messages', 'ruleHits', 'inputs', 'createdAt'],
            limit: 1,
            order: [['createdAt', 'DESC']]
          }
        ],
        limit: 20,
        order: [['createdAt', 'DESC']]
      })
    ])

    ok(res, {
      medicalProfile,
      healthDataRollups,
      recentAlerts,
      recentConsults,
      intakeResponses
    })
  } catch (error) {
    console.error('Error fetching client summary:', error)
    err(res, error)
  }
})

// ========== TRIAGE RULES MANAGEMENT ==========

// GET /api/v1/medical/triage-rules - List all triage rules
router.get('/triage-rules', async (req, res) => {
  try {
    const { status, severity } = req.query

    const where = {}
    if (status) where.status = status
    if (severity) where.severity = severity

    const pagination = getPagination(req.query)

    const result = await executePaginatedQuery(
      TriageRule,
      {
        where,
        include: [{ model: User, as: 'publisher', attributes: ['id', 'name'], required: false }],
        order: [['status', 'ASC'], ['severity', 'DESC'], ['createdAt', 'DESC']]
      },
      pagination
    )

    ok(res, result)
  } catch (error) {
    console.error('Error fetching triage rules:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/triage-rules/:id - Get specific triage rule
router.get('/triage-rules/:id', async (req, res) => {
  try {
    const { id } = req.params

    const rule = await TriageRule.findByPk(id, {
      include: [{ model: User, as: 'publisher', attributes: ['id', 'name'], required: false }]
    })

    if (!rule) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage rule not found' }, 404)
    }

    ok(res, rule)
  } catch (error) {
    console.error('Error fetching triage rule:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/triage-rules - Create new triage rule
router.post('/triage-rules', async (req, res) => {
  try {
    const medicalProId = req.user?.id
    const { name, version, severity, definition } = req.body

    if (!name || !version || !severity || !definition) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'name, version, severity, and definition are required' }, 400)
    }

    // Validate definition is valid JSON structure
    if (typeof definition !== 'object' || Array.isArray(definition)) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'definition must be a valid JSON object' }, 400)
    }

    const rule = await TriageRule.create({
      name,
      version,
      severity,
      definition,
      status: 'draft',
      publishedBy: null,
      publishedAt: null
    })

    ok(res, rule)
  } catch (error) {
    console.error('Error creating triage rule:', error)
    err(res, error)
  }
})

// PUT /api/v1/medical/triage-rules/:id - Update triage rule
router.put('/triage-rules/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, version, severity, definition, status } = req.body

    const rule = await TriageRule.findByPk(id)

    if (!rule) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage rule not found' }, 404)
    }

    // Only allow editing draft rules, or allow status changes on published rules
    if (rule.status === 'published' && (name || version || severity || definition)) {
      return err(res, { code: 'INVALID_OPERATION', message: 'Cannot modify published rule. Create a new version instead.' }, 400)
    }

    // Validate definition if provided
    if (definition && (typeof definition !== 'object' || Array.isArray(definition))) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'definition must be a valid JSON object' }, 400)
    }

    await rule.update({
      name: name || rule.name,
      version: version || rule.version,
      severity: severity || rule.severity,
      definition: definition !== undefined ? definition : rule.definition,
      status: status || rule.status
    })

    ok(res, rule)
  } catch (error) {
    console.error('Error updating triage rule:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/triage-rules/:id/publish - Publish a draft rule
router.post('/triage-rules/:id/publish', async (req, res) => {
  try {
    const medicalProId = req.user?.id
    const { id } = req.params

    const rule = await TriageRule.findByPk(id)

    if (!rule) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage rule not found' }, 404)
    }

    if (rule.status !== 'draft') {
      return err(res, { code: 'INVALID_STATUS', message: 'Only draft rules can be published' }, 400)
    }

    await rule.update({
      status: 'published',
      publishedBy: medicalProId,
      publishedAt: new Date()
    })

    ok(res, rule)
  } catch (error) {
    console.error('Error publishing triage rule:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/triage-rules/:id/retire - Retire a published rule
router.post('/triage-rules/:id/retire', async (req, res) => {
  try {
    const { id } = req.params

    const rule = await TriageRule.findByPk(id)

    if (!rule) {
      return err(res, { code: 'NOT_FOUND', message: 'Triage rule not found' }, 404)
    }

    if (rule.status !== 'published') {
      return err(res, { code: 'INVALID_STATUS', message: 'Only published rules can be retired' }, 400)
    }

    await rule.update({
      status: 'retired'
    })

    ok(res, rule)
  } catch (error) {
    console.error('Error retiring triage rule:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/triage-rules/test - Test rule against sample inputs
router.post('/triage-rules/test', async (req, res) => {
  try {
    const { definition, sampleInputs } = req.body

    if (!definition || !sampleInputs) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'definition and sampleInputs are required' }, 400)
    }

    // Basic validation - check if rule structure is valid
    // Full evaluation would be done by triageEngine
    const isValid = typeof definition === 'object' && !Array.isArray(definition) &&
                    typeof sampleInputs === 'object' && !Array.isArray(sampleInputs)

    if (!isValid) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid definition or sampleInputs format' }, 400)
    }

    // Return validation result (full evaluation would use triageEngine)
    ok(res, {
      valid: true,
      message: 'Rule structure is valid. Use triage engine for full evaluation.'
    })
  } catch (error) {
    console.error('Error testing triage rule:', error)
    err(res, error)
  }
})

// ==================== INTAKE FORMS MANAGEMENT ====================

// GET /api/v1/medical/intake-forms - List all intake forms
router.get('/intake-forms', async (req, res) => {
  try {
    const { status, page, pageSize } = req.query
    const pagination = getPagination({ page, pageSize })

    const whereClause = {}
    if (status) {
      whereClause.status = status
    }

    const result = await executePaginatedQuery(
      IntakeForm,
      {
        where: whereClause,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: IntakeResponse,
            as: 'responses',
            attributes: ['id'],
            required: false
          }
        ]
      },
      pagination
    )

    // Add response count to each form
    const formsWithCounts = result.items.map(form => {
      const formData = form.toJSON()
      formData.responseCount = formData.responses?.length || 0
      delete formData.responses
      return formData
    })

    ok(res, {
      items: formsWithCounts,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('Error fetching intake forms:', error)
    err(res, error)
  }
})

// GET /api/v1/medical/intake-forms/:id - Get intake form details
router.get('/intake-forms/:id', async (req, res) => {
  try {
    const { id } = req.params
    const form = await IntakeForm.findByPk(id, {
      include: [
        {
          model: IntakeResponse,
          as: 'responses',
          attributes: ['id', 'userId', 'createdAt'],
          required: false,
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    })

    if (!form) {
      return err(res, { code: 'NOT_FOUND', message: 'Intake form not found' }, 404)
    }

    ok(res, form)
  } catch (error) {
    console.error('Error fetching intake form:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/intake-forms - Create new intake form
router.post('/intake-forms', async (req, res) => {
  try {
    const { version, schema } = req.body

    if (!version || !schema) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'version and schema are required' }, 400)
    }

    // Validate schema is a valid JSON object
    if (typeof schema !== 'object' || Array.isArray(schema)) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'schema must be a valid JSON object' }, 400)
    }

    const form = await IntakeForm.create({
      version,
      schema,
      status: 'draft'
    })

    ok(res, form)
  } catch (error) {
    console.error('Error creating intake form:', error)
    err(res, error)
  }
})

// PUT /api/v1/medical/intake-forms/:id - Update intake form
router.put('/intake-forms/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { version, schema, status } = req.body

    const form = await IntakeForm.findByPk(id)
    if (!form) {
      return err(res, { code: 'NOT_FOUND', message: 'Intake form not found' }, 404)
    }

    // Only allow editing draft forms, or allow status changes on published forms
    if (form.status === 'published' && (version || schema)) {
      return err(res, { code: 'INVALID_OPERATION', message: 'Cannot modify published form. Create a new version instead.' }, 400)
    }

    // Validate schema if provided
    if (schema && (typeof schema !== 'object' || Array.isArray(schema))) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'schema must be a valid JSON object' }, 400)
    }

    const updateData = {}
    if (version) updateData.version = version
    if (schema) updateData.schema = schema
    if (status && ['draft', 'published'].includes(status)) {
      updateData.status = status
      if (status === 'published' && form.status !== 'published') {
        updateData.publishedAt = new Date()
      }
    }

    await form.update(updateData)

    ok(res, form)
  } catch (error) {
    console.error('Error updating intake form:', error)
    err(res, error)
  }
})

// POST /api/v1/medical/intake-forms/:id/publish - Publish intake form
router.post('/intake-forms/:id/publish', async (req, res) => {
  try {
    const { id } = req.params
    const medicalProId = req.user?.id

    const form = await IntakeForm.findByPk(id)
    if (!form) {
      return err(res, { code: 'NOT_FOUND', message: 'Intake form not found' }, 404)
    }

    if (form.status === 'published') {
      return err(res, { code: 'ALREADY_PUBLISHED', message: 'Form is already published' }, 400)
    }

    await form.update({
      status: 'published',
      publishedAt: new Date()
    })

    ok(res, form)
  } catch (error) {
    console.error('Error publishing intake form:', error)
    err(res, error)
  }
})

// DELETE /api/v1/medical/intake-forms/:id - Delete intake form (only if no responses)
router.delete('/intake-forms/:id', async (req, res) => {
  try {
    const { id } = req.params

    const form = await IntakeForm.findByPk(id, {
      include: [
        {
          model: IntakeResponse,
          as: 'responses',
          required: false
        }
      ]
    })

    if (!form) {
      return err(res, { code: 'NOT_FOUND', message: 'Intake form not found' }, 404)
    }

    // Check if form has responses
    const responseCount = form.responses?.length || 0
    if (responseCount > 0) {
      return err(res, {
        code: 'CANNOT_DELETE',
        message: `Cannot delete form with ${responseCount} response(s). Unpublish it instead.`
      }, 400)
    }

    await form.destroy()

    ok(res, { deleted: true, message: 'Intake form deleted successfully' })
  } catch (error) {
    console.error('Error deleting intake form:', error)
    err(res, error)
  }
})

module.exports = router

