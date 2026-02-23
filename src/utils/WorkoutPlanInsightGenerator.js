'use strict'

const { callGeminiWithRetry } = require('./GeminiTriage')
const {
  WorkoutPlan,
  WorkoutExercise,
  UserMedicalProfile,
  IntakeResponse,
  TriageRun,
  ConsultBooking,
  TriageRule
} = require('../models')
const { Op } = require('sequelize')

/**
 * Get user's medical context for insight generation
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} - User's medical context data
 */
async function getUserMedicalContext(userId) {
  // Get user's medical profile
  const medicalProfile = await UserMedicalProfile.findOne({
    where: { userId }
  })

  // Get most recent intake response
  const intakeResponse = await IntakeResponse.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']]
  })

  // Get most recent triage run
  const triageRun = await TriageRun.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']]
  })

  // Get most recent consult note
  const { ConsultNote } = require('../models')
  const recentBooking = await ConsultBooking.findOne({
    where: { userId },
    include: [
      {
        model: ConsultNote,
        as: 'note',
        required: false,
        attributes: ['id', 'recommendations', 'constraints', 'diagnoses', 'soap']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  const consultNote = recentBooking?.note || null

  return {
    medicalProfile,
    intakeResponse,
    triageRun,
    consultNote
  }
}

/**
 * Aggregate muscle groups from workout plan exercises
 * @param {Array} exercises - Array of WorkoutExercise instances
 * @returns {Array<string>} - Unique muscle groups
 */
function aggregateMuscleGroups(exercises) {
  const muscleGroups = new Set()
  exercises.forEach(exercise => {
    if (exercise.muscleGroups && Array.isArray(exercise.muscleGroups)) {
      exercise.muscleGroups.forEach(group => {
        if (group) muscleGroups.add(group)
      })
    }
  })
  return Array.from(muscleGroups)
}

/**
 * Build prompt for workout plan insight generation
 * @param {Object} workoutPlan - The WorkoutPlan instance
 * @param {Array} exercises - Array of WorkoutExercise instances
 * @param {Object} medicalContext - User's medical context
 * @param {Array} triageRules - Optional array of triage rules for context
 * @returns {string} - The formatted prompt
 */
function buildInsightPrompt(workoutPlan, exercises, medicalContext, triageRules = []) {
  const { medicalProfile, intakeResponse, triageRun, consultNote } = medicalContext

  // Build workout plan section
  const muscleGroups = aggregateMuscleGroups(exercises)
  const workoutPlanSection = `
WORKOUT PLAN:
Title: ${workoutPlan.title}
Difficulty: ${workoutPlan.difficulty}
Category: ${workoutPlan.category || 'N/A'}
Tags: ${(workoutPlan.tags || []).join(', ') || 'None'}
Duration: ${workoutPlan.estimatedDuration || 'N/A'} minutes
Description: ${workoutPlan.description || 'N/A'}
Muscle Groups: ${muscleGroups.join(', ') || 'N/A'}
Total Exercises: ${workoutPlan.totalExercises || exercises.length}
`

  // Build medical profile section
  const profileSection = medicalProfile ? `
USER MEDICAL PROFILE:
Conditions: ${(medicalProfile.conditions || []).join(', ') || 'None'}
Medications: ${(medicalProfile.medications || []).join(', ') || 'None'}
Allergies: ${(medicalProfile.allergies || []).join(', ') || 'None'}
Surgeries: ${(medicalProfile.surgeries || []).join(', ') || 'None'}
Pregnancy Status: ${medicalProfile.pregnancyStatus || 'N/A'}
Contraindications: ${(medicalProfile.contraindications || []).join(', ') || 'None'}
` : 'USER MEDICAL PROFILE: Not available'

  // Build intake form section
  const intakeSection = intakeResponse ? `
INTAKE FORM DATA:
${JSON.stringify(intakeResponse.answers || {}, null, 2)}
` : 'INTAKE FORM DATA: Not available'

  // Build triage results section
  const triageSection = triageRun ? `
TRIAGE RESULTS:
Risk Level: ${triageRun.riskLevel || 'N/A'}
Disposition: ${triageRun.disposition || 'N/A'}
Messages: ${(triageRun.messages || []).join('; ') || 'None'}
Rule Hits: ${JSON.stringify(triageRun.ruleHits || [], null, 2)}
` : 'TRIAGE RESULTS: Not available'

  // Build triage rules section (if provided)
  const rulesSection = triageRules.length > 0 ? `
REFERENCE TRIAGE GUIDELINES (for context - use these as reference, not strict rules):
${triageRules.slice(0, 15).map(rule => {
    const def = typeof rule.definition === 'string'
      ? JSON.parse(rule.definition)
      : rule.definition
    return `- ${rule.name} (${rule.severity}): ${JSON.stringify(def)}`
  }).join('\n')}
` : ''

  // Build consult notes section
  const consultSection = consultNote ? `
CONSULT NOTES:
Recommendations: ${Array.isArray(consultNote.recommendations) ? consultNote.recommendations.join('; ') : (consultNote.recommendations || 'None')}
Constraints: ${typeof consultNote.constraints === 'object' ? JSON.stringify(consultNote.constraints) : (consultNote.constraints || 'None')}
Diagnoses: ${Array.isArray(consultNote.diagnoses) ? consultNote.diagnoses.join('; ') : (consultNote.diagnoses || 'None')}
SOAP Notes: ${typeof consultNote.soap === 'object' ? JSON.stringify(consultNote.soap) : (consultNote.soap || 'None')}
` : 'CONSULT NOTES: Not available'

  return `You are a medical fitness advisor. Evaluate the following workout plan for a specific user's medical profile.

${workoutPlanSection}

${profileSection}

${intakeSection}

${triageSection}

${rulesSection}

${consultSection}

Analyze this workout plan for medical safety and appropriateness for this user. Provide a JSON response with:
1. insightText - Personalized guidance text (2-3 sentences, clear and actionable)
2. suitability - One of: "recommended", "caution", "not_recommended", "requires_modification"
3. customLabels - Array of 3-5 relevant labels (e.g., ["low-impact", "beginner-friendly", "cardio", "hypertension-safe"])

Guidelines:
- Be conservative: err on the side of caution for medical safety
- Consider medication interactions, allergies, contraindications, and medical conditions
- "recommended" = plan is safe and appropriate for this user
- "caution" = plan may be suitable with modifications or monitoring
- "not_recommended" = plan poses significant risks given user's medical profile
- "requires_modification" = plan needs specific adjustments before being safe
- Provide actionable, specific guidance in insightText
- Labels should be concise and relevant to the medical considerations

Only return valid JSON, no markdown formatting or code blocks.
`
}

/**
 * Parse and validate Gemini's insight response
 * @param {string} text - The raw text response from Gemini
 * @returns {Object} - Parsed and validated insight data
 */
function parseInsightResponse(text) {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    const parsed = JSON.parse(cleaned)

    // Validate required fields
    const validSuitabilityValues = ['recommended', 'caution', 'not_recommended', 'requires_modification']
    if (!validSuitabilityValues.includes(parsed.suitability)) {
      throw new Error(`Invalid suitability: ${parsed.suitability}. Must be one of: ${validSuitabilityValues.join(', ')}`)
    }

    if (!parsed.insightText || typeof parsed.insightText !== 'string') {
      throw new Error('insightText is required and must be a string')
    }

    if (!Array.isArray(parsed.customLabels)) {
      throw new Error('customLabels must be an array')
    }

    return {
      insightText: parsed.insightText.trim(),
      suitability: parsed.suitability,
      customLabels: parsed.customLabels.filter(label => typeof label === 'string').slice(0, 5) // Limit to 5 labels
    }
  } catch (error) {
    console.error('Failed to parse insight response:', error)
    console.error('Raw response:', text.substring(0, 500))
    throw new Error(`Invalid Gemini response format: ${error.message}`)
  }
}

/**
 * Generate workout plan insight using AI (Gemini)
 * @param {number} workoutPlanId - The workout plan ID
 * @param {number} userId - The user ID
 * @param {Object} options - Optional settings
 * @param {boolean} options.includeRules - Whether to include triage rules as context (default: true)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} - Generated insight data with medical context IDs
 */
async function generateWorkoutPlanInsightWithAI(workoutPlanId, userId, options = {}) {
  const {
    includeRules = true,
    maxRetries = 3
  } = options

  try {
    // Fetch workout plan with exercises
    const workoutPlan = await WorkoutPlan.findByPk(workoutPlanId, {
      include: [
        {
          model: WorkoutExercise,
          as: 'exercises',
          attributes: ['id', 'name', 'muscleGroups', 'category', 'equipment'],
          order: [['order', 'ASC']]
        }
      ]
    })

    if (!workoutPlan) {
      throw new Error(`Workout plan with ID ${workoutPlanId} not found`)
    }

    // Get user's medical context
    const medicalContext = await getUserMedicalContext(userId)

    // Optionally load triage rules for context
    let triageRules = []
    if (includeRules) {
      triageRules = await TriageRule.findAll({
        where: { status: 'published' },
        order: [['severity', 'DESC']],
        limit: 15 // Limit to avoid token overflow
      })
    }

    // Build prompt
    const prompt = buildInsightPrompt(workoutPlan, workoutPlan.exercises || [], medicalContext, triageRules)

    // Call Gemini API with retry (reuses model selection logic from GeminiTriage)
    const response = await callGeminiWithRetry(prompt, maxRetries)
    const responseText = typeof response === 'string' ? response : response.text

    console.log('Gemini insight generation response:', responseText.substring(0, 200) + '...')

    // Parse response
    const insightData = parseInsightResponse(responseText)

    // Build medical context IDs for storage
    const medicalContextIds = {
      intakeResponseId: medicalContext.intakeResponse?.id || null,
      triageRunId: medicalContext.triageRun?.id || null,
      consultNoteId: medicalContext.consultNote?.id || null
    }

    return {
      ...insightData,
      medicalContext: medicalContextIds
    }
  } catch (error) {
    console.error('Workout plan insight generation error:', error)
    throw error
  }
}

module.exports = {
  generateWorkoutPlanInsightWithAI,
  getUserMedicalContext,
  buildInsightPrompt,
  parseInsightResponse
}

