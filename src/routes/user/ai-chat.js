'use strict'

const express = require('express')
const router = express.Router()
const { ok, err } = require('../../utils/errors')
const {
  TraineeAiThread,
  TraineeAiMessage,
  UserProfile,
  UserSubscription,
  Trainer
} = require('../../models')
const { requireAuth } = require('../../middleware')
const { callGeminiWithRetry } = require('../../utils/GeminiTriage')
const { buildTraineeAiContextBlock } = require('../../utils/traineeAiContext')
const { Op } = require('sequelize')

router.use(requireAuth)

const MAX_MESSAGES = 24
const MAX_USER_MESSAGE_LEN = 4000

function systemPreamble() {
  return `You are AxumPulse Trainee Coach — a supportive fitness and wellness assistant.
You are NOT a doctor. Do not diagnose, prescribe medication, or replace professional medical advice.
Encourage users to consult licensed professionals for medical concerns.
Be concise, practical, and culturally sensitive.`
}

// GET /user/ai-chat/threads
router.get('/threads', async (req, res) => {
  try {
    const userId = req.user.id
    const threads = await TraineeAiThread.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 50
    })
    ok(res, { items: threads })
  } catch (e) {
    err(res, e)
  }
})

// POST /user/ai-chat/threads  body: { trainerUserId?: number, title?: string }
router.post('/threads', async (req, res) => {
  try {
    const userId = req.user.id
    let { trainerUserId, title } = req.body || {}

    if (trainerUserId != null) {
      trainerUserId = parseInt(trainerUserId, 10)
      const sub = await UserSubscription.findOne({
        where: {
          userId,
          trainerId: trainerUserId,
          status: 'active',
          expiresAt: { [Op.gt]: new Date() }
        }
      })
      if (!sub) {
        return err(res, { code: 'FORBIDDEN', message: 'You can only open coach threads for trainers you are subscribed to' }, 403)
      }
      const tr = await Trainer.findOne({ where: { userId: trainerUserId, verified: true } })
      if (!tr) {
        return err(res, { code: 'NOT_FOUND', message: 'Trainer not found' }, 404)
      }
    } else {
      trainerUserId = null
    }

    const thread = await TraineeAiThread.create({
      userId,
      trainerUserId,
      title: title || null
    })
    ok(res, { thread })
  } catch (e) {
    err(res, e)
  }
})

// GET /user/ai-chat/threads/:id/messages
router.get('/threads/:id/messages', async (req, res) => {
  try {
    const userId = req.user.id
    const threadId = parseInt(req.params.id, 10)
    const thread = await TraineeAiThread.findOne({ where: { id: threadId, userId } })
    if (!thread) {
      return err(res, { code: 'NOT_FOUND', message: 'Thread not found' }, 404)
    }
    const messages = await TraineeAiMessage.findAll({
      where: { threadId },
      order: [['createdAt', 'ASC']],
      limit: 200
    })
    ok(res, { thread, messages })
  } catch (e) {
    err(res, e)
  }
})

// POST /user/ai-chat/threads/:id/messages  body: { message: string }
router.post('/threads/:id/messages', async (req, res) => {
  try {
    const userId = req.user.id
    const threadId = parseInt(req.params.id, 10)
    const text = String(req.body?.message || '').trim()
    if (!text) {
      return err(res, { code: 'BAD_REQUEST', message: 'message is required' }, 400)
    }
    if (text.length > MAX_USER_MESSAGE_LEN) {
      return err(res, { code: 'BAD_REQUEST', message: 'message too long' }, 400)
    }

    const thread = await TraineeAiThread.findOne({ where: { id: threadId, userId } })
    if (!thread) {
      return err(res, { code: 'NOT_FOUND', message: 'Thread not found' }, 404)
    }

    await TraineeAiMessage.create({
      threadId,
      role: 'user',
      content: text
    })

    const history = await TraineeAiMessage.findAll({
      where: { threadId },
      order: [['createdAt', 'DESC']],
      limit: MAX_MESSAGES
    })
    history.reverse()

    const profile = await UserProfile.findOne({ where: { userId } })
    const sharing = profile?.preferences?.aiContextSharing || {}
    const contextBlock = await buildTraineeAiContextBlock(userId, sharing)

    let historyText = ''
    for (const m of history) {
      if (m.role === 'system') continue
      historyText += `${m.role.toUpperCase()}: ${m.content}\n`
    }

    const prompt = `${systemPreamble()}

CONTEXT (respect user privacy — only use what appears below):
${contextBlock}

CONVERSATION:
${historyText}

ASSISTANT (reply helpfully, short paragraphs):`

    let replyText
    try {
      const gemini = await callGeminiWithRetry(prompt, 2)
      replyText = typeof gemini === 'string' ? gemini : gemini?.text
    } catch (gemErr) {
      console.error('Trainee AI Gemini error:', gemErr)
      replyText =
        'The AI coach is temporarily unavailable. Please try again later. You can still use workouts and challenges in the app.'
    }

    const assistantMsg = await TraineeAiMessage.create({
      threadId,
      role: 'assistant',
      content: replyText || '(empty response)'
    })

    await TraineeAiThread.update({ updatedAt: new Date() }, { where: { id: threadId } })

    ok(res, { message: assistantMsg })
  } catch (e) {
    err(res, e)
  }
})

module.exports = { router }
