'use strict'

const { GoogleGenerativeAI } = require('@google/generative-ai')
const axios = require('axios')
const { TriageRun, TriageRule } = require('../models')

// Initialize Gemini (will use GEMINI_API_KEY from environment)
let genAI = null
let model = null

function initializeGemini() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set. Gemini triage will use fallback mode.')
    return false
  }
 
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    // Don't initialize a model here - we'll discover and use available models dynamically
    // This prevents using a model that doesn't exist or isn't available
    return true
  } catch (error) {
    console.error('Failed to initialize Gemini:', error)
    return false
  }
}

// Initialize on module load
const geminiInitialized = initializeGemini()

/**
 * Build prompt for Gemini triage analysis
 * @param {Object} intakeAnswers - The intake form answers
 * @param {Object} medicalProfile - The user's medical profile data
 * @param {Array} triageRules - Optional array of triage rules for context
 * @returns {string} - The formatted prompt
 */
function buildTriagePrompt(intakeAnswers, medicalProfile, triageRules = []) {
  const profileSection = medicalProfile ? `
MEDICAL PROFILE:
- Conditions: ${(medicalProfile.conditions || []).join(', ') || 'None'}
- Medications: ${(medicalProfile.medications || []).join(', ') || 'None'}
- Allergies: ${(medicalProfile.allergies || []).join(', ') || 'None'}
- Surgeries: ${(medicalProfile.surgeries || []).join(', ') || 'None'}
- Pregnancy Status: ${medicalProfile.pregnancyStatus || 'N/A'}
- Contraindications: ${(medicalProfile.contraindications || []).join(', ') || 'None'}
` : 'MEDICAL PROFILE: Not available'

  const rulesSection = triageRules.length > 0 ? `
REFERENCE TRIAGE GUIDELINES (for context - use these as reference, not strict rules):
${triageRules.slice(0, 15).map(rule => {
    const def = typeof rule.definition === 'string' 
      ? JSON.parse(rule.definition) 
      : rule.definition
    return `- ${rule.name} (${rule.severity}): ${JSON.stringify(def)}`
  }).join('\n')}
` : ''

  return `You are a medical triage AI assistant. Analyze the following intake form responses and medical profile to determine risk level and appropriate disposition.

${profileSection}

INTAKE FORM RESPONSES:
${JSON.stringify(intakeAnswers, null, 2)}

${rulesSection}

Analyze this information and provide a JSON response with the following structure:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "disposition": "ok" | "book_consult" | "urgent_care",
  "messages": ["message1", "message2", ...],
  "ruleHits": [
    {
      "ruleName": "name of applicable guideline or condition",
      "severity": "low" | "medium" | "high" | "critical",
      "reason": "why this applies"
    }
  ],
  "reasoning": "brief explanation of your assessment"
}

IMPORTANT GUIDELINES:
- Be conservative: err on the side of caution for medical safety
- "critical" risk = immediate medical attention needed (chest pain, severe symptoms, life-threatening conditions)
- "high" risk = consult needed soon (persistent symptoms, concerning patterns, medication interactions)
- "medium" risk = consult recommended (moderate concerns, new symptoms, routine follow-up needed)
- "low" risk = routine monitoring (minor symptoms, stable conditions, no immediate concerns)
- Always provide clear, actionable messages to the user
- Consider medication interactions, allergies, and contraindications
- Only return valid JSON, no markdown formatting or code blocks`
}

/**
 * Parse Gemini response and validate structure
 * @param {string} text - The raw text response from Gemini
 * @returns {Object} - Parsed and validated triage result
 */
function parseGeminiResponse(text) {
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
    const validRiskLevels = ['low', 'medium', 'high', 'critical']
    const validDispositions = ['ok', 'book_consult', 'urgent_care']
    
    if (!validRiskLevels.includes(parsed.riskLevel)) {
      throw new Error(`Invalid riskLevel: ${parsed.riskLevel}. Must be one of: ${validRiskLevels.join(', ')}`)
    }
    if (!validDispositions.includes(parsed.disposition)) {
      throw new Error(`Invalid disposition: ${parsed.disposition}. Must be one of: ${validDispositions.join(', ')}`)
    }
    
    return {
      riskLevel: parsed.riskLevel,
      disposition: parsed.disposition,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      ruleHits: Array.isArray(parsed.ruleHits) ? parsed.ruleHits : [],
      reasoning: parsed.reasoning || ''
    }
  } catch (error) {
    console.error('Failed to parse Gemini response:', error)
    console.error('Raw response:', text.substring(0, 500))
    throw new Error(`Invalid Gemini response format: ${error.message}`)
  }
}

/**
 * List available models from the Gemini API
 * @returns {Promise<Array<string>>} - Array of available model names
 */
async function listAvailableModels() {
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return []
  }
  
  try {
    // Use the REST API to list models
    const apiKey = process.env.GEMINI_API_KEY
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models`, {
      params: { key: apiKey }
    })
    
    if (response.data && response.data.models) {
      const modelNames = response.data.models
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''))
      console.log('Available Gemini models:', modelNames)
      return modelNames
    }
    return []
  } catch (error) {
    console.warn('Failed to list available models:', error.message)
    return []
  }
}

/**
 * Try to initialize a model with a specific name
 * @param {string} modelName - The model name to try
 * @returns {Object|null} - The model instance or null if it fails
 */
function tryInitializeModel(modelName) {
  try {
    return genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40
      }
    })
  } catch (error) {
    console.warn(`Failed to initialize model ${modelName}:`, error.message)
    return null
  }
}

/**
 * Call Gemini API with retry logic and model fallback
 * @param {string} prompt - The prompt to send
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} - The response text
 */
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  console.log('Calling Gemini API with prompt:', prompt.substring(0, 200) + '...')
  if (!geminiInitialized || !genAI) {
    throw new Error('Gemini API not initialized. Check GEMINI_API_KEY environment variable.')
  }
  
  // First, try to get available models from the API
  let availableModels = []
  try {
    availableModels = await listAvailableModels()
  } catch (error) {
    console.warn('Could not fetch available models, using fallback list:', error.message)
  }
  
  // Prioritize free-tier models (flash models are usually free-tier)
  // Order: flash models first (free-tier), then pro models
  const prioritizeModels = (models) => {
    const flashModels = models.filter(m => m.includes('flash') && !m.includes('pro'))
    const proModels = models.filter(m => m.includes('pro'))
    const otherModels = models.filter(m => !m.includes('flash') && !m.includes('pro'))
    return [...flashModels, ...proModels, ...otherModels]
  }
  
  // List of fallback model names (prioritize flash models for free-tier)
  const fallbackModelNames = [
    'gemini-2.5-flash',              // Latest flash (usually free-tier)
    'gemini-flash-latest',           // Latest flash alias
    'gemini-2.0-flash',              // Stable flash
    'gemini-1.5-flash',              // Older flash
    'gemini-pro',                    // Basic pro
    'gemini-pro-latest',             // Latest pro alias
    'gemini-1.5-pro',                // Standard pro
    'gemini-1.0-pro'                 // Older pro
  ]
  
  // Build model list: prioritize available models, then fallback
  let modelNames = []
  if (availableModels.length > 0) {
    // Prioritize flash models from available list
    const prioritizedAvailable = prioritizeModels(availableModels)
    modelNames = [...new Set([
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      ...prioritizedAvailable,
      ...fallbackModelNames
    ])]
  } else {
    modelNames = [...new Set([
      ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []),
      ...fallbackModelNames
    ])]
  }
  
  let currentModel = null
  let lastError = null
  let successfulModelName = null
  
  // Try each model name if the current one fails
  for (let modelAttempt = 0; modelAttempt < modelNames.length; modelAttempt++) {
    const modelName = modelNames[modelAttempt]
    
    // Always initialize the model (we don't pre-initialize anymore)
    console.log(`Trying model: ${modelName}`)
    currentModel = tryInitializeModel(modelName)
    if (!currentModel) {
      continue // Try next model
    }
    
    // Retry logic for the current model
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await currentModel.generateContent(prompt)
        const response = await result.response
        // Update the global model reference for future use
        model = currentModel
        successfulModelName = modelName
        console.log(`Successfully using model: ${modelName}`)
        // Store model name in response for tracking
        const responseText = response.text()
        // Attach model name to the response (we'll handle this differently)
        return { text: responseText, modelName: modelName }
      } catch (error) {
        lastError = error
        console.warn(`Gemini API call attempt ${attempt} with model ${modelName} failed:`, error.message)
        
        // Don't retry on API key or permission errors - these won't work with any model
        if (error.message?.includes('API key') || error.message?.includes('permission')) {
          throw error
        }
        
        // If it's a quota error (429), skip this model and try the next one
        if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
          console.warn(`Quota exceeded for model ${modelName}, trying next model...`)
          break // Break out of retry loop, try next model
        }
        
        // If it's a 404 (model not found), try next model immediately
        if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('is not found')) {
          break // Break out of retry loop, try next model
        }
        
        // For other errors, retry with exponential backoff
        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
  }
  
  throw lastError || new Error('Gemini API call failed after trying all available models')
}

/**
 * Create a safe fallback triage run when Gemini fails
 * @param {Object} intakeResponse - The IntakeResponse model instance
 * @param {Object} medicalProfile - The UserMedicalProfile model instance (can be null)
 * @param {Error} error - The error that occurred
 * @returns {Object} - The created TriageRun instance
 */
async function createFallbackTriageRun(intakeResponse, medicalProfile, error) {
  const intakeAnswers = intakeResponse.answers || {}
  const profileData = medicalProfile ? {
    conditions: medicalProfile.conditions || [],
    medications: medicalProfile.medications || [],
    allergies: medicalProfile.allergies || [],
    surgeries: medicalProfile.surgeries || [],
    pregnancyStatus: medicalProfile.pregnancyStatus,
    contraindications: medicalProfile.contraindications || []
  } : {}

  // Conservative fallback - recommend consultation
  return await TriageRun.create({
    userId: intakeResponse.userId,
    intakeResponseId: intakeResponse.id,
    inputs: {
      intakeAnswers,
      medicalProfile: profileData,
      error: error.message,
      fallback: true
    },
    ruleHits: [],
    riskLevel: 'medium', // Conservative fallback
    disposition: 'book_consult', // Safe default
    messages: [
      'Automated triage analysis is temporarily unavailable. Please consult with a medical professional for assessment.'
    ],
    createdByType: 'ai',
    createdBy: null
  })
}

/**
 * Evaluate triage using Gemini API
 * @param {Object} intakeResponse - The IntakeResponse model instance
 * @param {Object} medicalProfile - The UserMedicalProfile model instance (can be null)
 * @param {Object} options - Optional settings
 * @param {boolean} options.includeRules - Whether to include triage rules as context (default: true)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @returns {Object} - The created TriageRun instance
 */
async function evaluateTriageWithGemini(intakeResponse, medicalProfile, options = {}) {
  const {
    includeRules = true, // Whether to include triage rules as context
    maxRetries = 3
  } = options

  try {
    // Optionally load triage rules for context
    let triageRules = []
    if (includeRules) {
      triageRules = await TriageRule.findAll({
        where: { status: 'published' },
        order: [['severity', 'DESC']],
        limit: 15 // Limit to avoid token overflow
      })
    }

    const intakeAnswers = intakeResponse.answers || {}
    const profileData = medicalProfile ? {
      conditions: medicalProfile.conditions || [],
      medications: medicalProfile.medications || [],
      allergies: medicalProfile.allergies || [],
      surgeries: medicalProfile.surgeries || [],
      pregnancyStatus: medicalProfile.pregnancyStatus,
      contraindications: medicalProfile.contraindications || []
    } : {}

    // Build prompt
    const prompt = buildTriagePrompt(intakeAnswers, profileData, triageRules)

    // Call Gemini API with retry
    const response = await callGeminiWithRetry(prompt, maxRetries)
    const responseText = typeof response === 'string' ? response : response.text
    const usedModelName = typeof response === 'string' ? null : response.modelName
    console.log('Gemini response:', responseText)
    // Parse response
    const triageResult = parseGeminiResponse(responseText)

    // Map ruleHits to match existing structure
    const ruleHits = triageResult.ruleHits.map(hit => ({
      ruleName: hit.ruleName || 'AI Analysis',
      severity: hit.severity || triageResult.riskLevel,
      reason: hit.reason || hit.reasoning || ''
    }))

    // Create triage run record
    const triageRun = await TriageRun.create({
      userId: intakeResponse.userId,
      intakeResponseId: intakeResponse.id,
      inputs: {
        intakeAnswers,
        medicalProfile: profileData,
        geminiReasoning: triageResult.reasoning, // Store AI reasoning
        geminiModel: usedModelName || process.env.GEMINI_MODEL || 'auto-selected'
      },
      ruleHits,
      riskLevel: triageResult.riskLevel,
      disposition: triageResult.disposition,
      messages: triageResult.messages,
      createdByType: 'ai',
      createdBy: null
    })

    return triageRun
  } catch (error) {
    console.error('Gemini triage evaluation error:', error)
    
    // Fallback: Create a safe default triage run
    return await createFallbackTriageRun(intakeResponse, medicalProfile, error)
  }
}

module.exports = {
  evaluateTriageWithGemini,
  buildTriagePrompt,
  parseGeminiResponse,
  callGeminiWithRetry,
  createFallbackTriageRun
}

