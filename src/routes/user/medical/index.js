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
  ConsultSchedule,
  ConsultSlot,
  ConsultBooking,
  ConsultNote,
  HealthDataPoint,
  HealthDataRollup,
  HealthAlert,
  User,
  MedicalProfessional,
  UserProfile
} = require('../../../models')
const { Op } = require('sequelize')
// const { evaluateTriageRules } = require('../../../utils/triageEngine')
const { evaluateTriageWithGemini } = require('../../../utils/GeminiTriage')

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

    // Run triage evaluation using Gemini
    const triageResult = await evaluateTriageWithGemini(response, medicalProfile, {
      includeRules: true, // Include triage rules as context for Gemini
      maxRetries: 3
    })

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

// GET /api/v1/user/medical/consults/doctors - List available medical professionals
router.get('/consults/doctors', async (req, res) => {
  try {
    const { Op } = require('sequelize')
    const doctors = await User.findAll({
      where: { isMedical: true },
      include: [
        {
          model: MedicalProfessional,
          as: 'medicalProfessional',
          where: { 
            verified: true,
            consultFee: { [Op.ne]: null } // Only show doctors with set consult fee
          },
          required: true,
          attributes: ['professionalType', 'specialties', 'verified', 'consultFee']
        }
      ],
      attributes: ['id', 'name', 'profilePicture', 'email'],
      order: [['name', 'ASC']]
    })

    ok(res, doctors)
  } catch (error) {
    console.error('Error fetching doctors:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/balance - Get available consult count
router.get('/consults/balance', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const profile = await UserProfile.findOne({ where: { userId } })
    
    if (!profile) {
      // Create profile if it doesn't exist
      const newProfile = await UserProfile.create({ userId, availableConsults: 0 })
      return ok(res, { availableConsults: 0 })
    }

    ok(res, { availableConsults: profile.availableConsults || 0 })
  } catch (error) {
    console.error('Error fetching consult balance:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/slots - List available consult slots (generated from schedules)
router.get('/consults/slots', async (req, res) => {
  try {
    const { providerId, weekStartDate } = req.query

    if (!providerId) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'providerId is required' }, 400)
    }

    // Calculate week start (Monday) - parse as local date, not UTC
    let weekStart
    if (weekStartDate) {
      // Parse YYYY-MM-DD string as local date (not UTC)
      const [year, month, day] = weekStartDate.split('-').map(Number)
      weekStart = new Date(year, month - 1, day, 0, 0, 0, 0) // month is 0-indexed
    } else {
      // Get current week's Monday
      const now = new Date()
      const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const diff = day === 0 ? -6 : 1 - day // Monday is day 1, so offset is 1-day
      weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff)
      weekStart.setHours(0, 0, 0, 0)
    }

    // Get all active schedules for this provider
    const schedules = await ConsultSchedule.findAll({
      where: {
        providerId: parseInt(providerId),
        status: 'active'
      }
    })

    // Generate slots dynamically from schedules (don't store them)
    const weekStartStr = typeof weekStartDate === 'string' ? weekStartDate : 
      `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
    
    const generatedSlots = []
    for (const schedule of schedules) {
      const slots = await schedule.generateSlotsForWeekDynamic(weekStartStr)
      generatedSlots.push(...slots)
    }

    // Get booked slots for this provider in this week to filter them out
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const bookings = await ConsultBooking.findAll({
      where: {
        status: 'booked'
      },
      include: [
        {
          model: ConsultSlot,
          as: 'slot',
          required: true,
          where: {
            providerId: parseInt(providerId),
            startAt: {
              [Op.gte]: weekStart,
              [Op.lt]: weekEnd
            }
          }
        }
      ]
    })

    // Create a set of booked slot times (using ISO string for comparison)
    const bookedSlotTimes = new Set()
    bookings.forEach(booking => {
      if (booking.slot) {
        const slotTime = new Date(booking.slot.startAt).toISOString()
        bookedSlotTimes.add(slotTime)
      }
    })

    // Filter out booked slots and format with provider info
    const provider = await User.findByPk(parseInt(providerId), {
      attributes: ['id', 'name', 'profilePicture'],
      include: [
        {
          model: MedicalProfessional,
          as: 'medicalProfessional',
          attributes: ['professionalType', 'specialties', 'verified']
        }
      ]
    })

    const openSlots = generatedSlots
      .filter(slot => {
        const slotTime = new Date(slot.startAt).toISOString()
        return !bookedSlotTimes.has(slotTime)
      })
      .map(slot => ({
        ...slot,
        provider: provider
      }))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())

    ok(res, openSlots)
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

    const { startAt, providerId } = req.body

    if (!startAt || !providerId) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'startAt and providerId are required' }, 400)
    }

    const providerIdNum = parseInt(providerId)
    if (isNaN(providerIdNum)) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid providerId' }, 400)
    }

    // Parse the startAt date - it comes as an ISO string from the frontend
    const startDateTime = new Date(startAt)
    if (isNaN(startDateTime.getTime())) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid startAt date format' }, 400)
    }
    
    // Extract date and time components from ISO string (UTC format)
    // Since slots are generated in UTC, we need to compare UTC times
    const isoMatch = startAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!isoMatch) {
      return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid ISO date format' }, 400)
    }
    
    const [, year, month, day, utcHour, minute] = isoMatch.map(Number)

    // Check if slot is already booked by querying ConsultSlot directly
    const existingSlot = await ConsultSlot.findOne({
      where: {
        providerId: providerIdNum,
        startAt: startDateTime
      },
      include: [
        {
          model: ConsultBooking,
          as: 'booking',
          required: false
        }
      ]
    })

    if (existingSlot && existingSlot.booking && existingSlot.booking.status === 'booked') {
      return err(res, { code: 'ALREADY_BOOKED', message: 'Slot is already booked' }, 400)
    }

    // Find or create the ConsultSlot record
    // Calculate endAt based on schedule duration (default 30 minutes)
    const schedules = await ConsultSchedule.findAll({
      where: {
        providerId: providerIdNum,
        status: 'active'
      }
    })
    
    // Helper to parse timezone offset (default UTC+3)
    const parseTimezoneOffset = (timezone) => {
      if (!timezone) return 3 // Default UTC+3
      const tzMatch = timezone.match(/^([+-])(\d{2}):?(\d{2})?$/)
      if (tzMatch) {
        const sign = tzMatch[1] === '+' ? 1 : -1
        const hours = parseInt(tzMatch[2], 10)
        return sign * hours
      }
      return 3 // Default UTC+3
    }
    
    let matchingSchedule = null
    let slotDuration = 30 // default
    
    // Match by converting UTC slot time back to local time and comparing with schedule
    // Slots are stored with UTC times that include timezone offset (added)
    // Convert back to local time for comparison
    for (const schedule of schedules) {
      const timezoneOffset = parseTimezoneOffset(schedule.timezone)
      
      // Convert UTC time back to local time (add offset)
      // When storing: Local - Offset = UTC
      // When converting back: UTC + Offset = Local
      let localHour = utcHour + timezoneOffset
      let localDay = day
      let localYear = year
      let localMonth = month
      
      // Handle day rollover when converting from UTC to local (adding offset)
      if (localHour >= 24) {
        localHour -= 24
        localDay += 1
      } else if (localHour < 0) {
        localHour += 24
        localDay -= 1
      }
      
      // Get day of week for the local date (using UTC date constructor to avoid timezone issues)
      const localDate = new Date(Date.UTC(localYear, localMonth - 1, localDay))
      const localDayOfWeek = localDate.getUTCDay()
      
      // Compare with schedule
      if (schedule.dayOfWeek === localDayOfWeek) {
        const startTimeStr = typeof schedule.startTime === 'string' ? schedule.startTime : String(schedule.startTime)
        const endTimeStr = typeof schedule.endTime === 'string' ? schedule.endTime : String(schedule.endTime)
        const [startHours, startMinutes] = startTimeStr.split(':').map(Number)
        const [endHours, endMinutes] = endTimeStr.split(':').map(Number)
        const scheduleStartMinutes = startHours * 60 + startMinutes
        const scheduleEndMinutes = endHours * 60 + endMinutes
        const slotLocalMinutes = localHour * 60 + minute
        
        // Allow a small tolerance (1 minute) for time matching
        if (slotLocalMinutes >= scheduleStartMinutes - 1 && slotLocalMinutes < scheduleEndMinutes) {
          matchingSchedule = schedule
          slotDuration = schedule.duration
          break
        }
      }
    }

    if (!matchingSchedule) {
      // Log details for debugging
      console.log('No matching schedule found. Details:', {
        isoString: startAt,
        utcHour,
        minute,
        schedulesCount: schedules.length,
        schedules: schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          timezone: s.timezone
        }))
      })
      return err(res, { 
        code: 'NOT_FOUND', 
        message: `No matching schedule found for this time slot` 
      }, 404)
    }

    // Check if user has available consults
    const profile = await UserProfile.findOne({ where: { userId } })
    const availableConsults = profile ? (profile.availableConsults || 0) : 0
    
    if (availableConsults <= 0) {
      return err(res, { 
        code: 'INSUFFICIENT_CONSULTS', 
        message: 'You do not have any available consults. Please purchase consults before booking.' 
      }, 400)
    }

    const endDateTime = new Date(startDateTime)
    endDateTime.setUTCMinutes(endDateTime.getUTCMinutes() + slotDuration)

    // Use existingSlot if found, otherwise create new ConsultSlot
    let slot = existingSlot
    if (!slot) {
      slot = await ConsultSlot.create({
        providerId: providerIdNum,
        startAt: startDateTime,
        endAt: endDateTime,
        type: matchingSchedule.type,
        timezone: matchingSchedule.timezone,
        status: 'open'
      })
    } else {
      // Reload slot to ensure we have the latest booking info
      slot = await ConsultSlot.findByPk(slot.id, {
        include: [{ model: ConsultBooking, as: 'booking' }]
      })
      
      if (slot && slot.booking && slot.booking.status === 'booked') {
        return err(res, { code: 'ALREADY_BOOKED', message: 'Slot is already booked' }, 400)
      }
    }

    // Create booking and decrement available consults in a transaction
    const sequelize = require('sequelize')
    const db = require('../../../models').sequelize
    
    const result = await db.transaction(async (t) => {
      // Create booking
      const booking = await ConsultBooking.create({
        userId,
        slotId: slot.id,
        status: 'booked'
      }, { transaction: t })

      // Decrement available consults
      if (profile) {
        await profile.decrement('availableConsults', { by: 1, transaction: t })
      } else {
        // This shouldn't happen since we checked above, but handle it just in case
        await UserProfile.create({ 
          userId, 
          availableConsults: 0 
        }, { transaction: t })
      }

      return booking
    })

    const booking = result

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
        where: { userId, status: 'booked' },
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

// POST /api/v1/user/medical/consults/bookings/:id/join-call - Join a call room
router.post('/consults/bookings/:id/join-call', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

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

    if (!booking.callRoomId) {
      return err(res, { code: 'NO_CALL_STARTED', message: 'Call has not been started yet' }, 400)
    }

    // Update call status to in_progress when user joins
    if (booking.callStatus === 'ringing') {
      await booking.update({ callStatus: 'in_progress' })
    }

    ok(res, {
      bookingId: booking.id,
      roomId: booking.callRoomId,
      callStatus: booking.callStatus,
      message: 'Ready to join call'
    })
  } catch (error) {
    console.error('Error joining call:', error)
    err(res, error)
  }
})

// GET /api/v1/user/medical/consults/bookings/:id/call-status - Get call status
router.get('/consults/bookings/:id/call-status', async (req, res) => {
  try {
    const userId = req.user?.id
    const { id } = req.params

    if (!userId) {
      return err(res, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const booking = await ConsultBooking.findOne({
      where: { id, userId }
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

module.exports = router

