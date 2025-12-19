'use strict'

const { TriageRule, TriageRun } = require('../models')

/**
 * Evaluate a field value against a condition
 * @param {*} fieldValue - The value from the data
 * @param {string} operator - The operator (eq, neq, gt, lt, gte, lte, includes, exists)
 * @param {*} conditionValue - The value to compare against
 * @returns {boolean} - Whether the condition matches
 */
function evaluateCondition(fieldValue, operator, conditionValue) {
  switch (operator) {
    case 'eq':
      return fieldValue === conditionValue
    case 'neq':
      return fieldValue !== conditionValue
    case 'gt':
      return Number(fieldValue) > Number(conditionValue)
    case 'lt':
      return Number(fieldValue) < Number(conditionValue)
    case 'gte':
      return Number(fieldValue) >= Number(conditionValue)
    case 'lte':
      return Number(fieldValue) <= Number(conditionValue)
    case 'includes':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(conditionValue)
      }
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase())
      }
      return false
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null || fieldValue === ''
    default:
      return false
  }
}

/**
 * Get nested field value from an object using dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - Dot-notation path (e.g., 'symptoms.chest_pain')
 * @returns {*} - The value at the path, or undefined
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let value = obj
  for (const part of parts) {
    if (value === null || value === undefined) return undefined
    value = value[part]
  }
  return value
}

/**
 * Evaluate a single triage rule against intake response and medical profile
 * @param {Object} rule - The triage rule definition
 * @param {Object} intakeAnswers - The intake form answers
 * @param {Object} medicalProfile - The user's medical profile
 * @returns {Object|null} - Rule hit result or null if rule doesn't match
 */
function evaluateRule(rule, intakeAnswers, medicalProfile) {
  const { conditions, actions } = rule.definition

  if (!conditions || !Array.isArray(conditions)) {
    return null
  }

  // Evaluate all conditions (AND logic - all must pass)
  let allConditionsMatch = true

  for (const condition of conditions) {
    const { field, operator, value } = condition

    if (!field || !operator) {
      continue
    }

    // Get field value from intake answers or medical profile
    let fieldValue = getNestedValue(intakeAnswers, field)
    if (fieldValue === undefined) {
      fieldValue = getNestedValue(medicalProfile, field)
    }

    // Evaluate condition
    const conditionMatches = evaluateCondition(fieldValue, operator, value)

    if (!conditionMatches) {
      allConditionsMatch = false
      break
    }
  }

  // If all conditions match, return rule hit
  if (allConditionsMatch) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      actions: actions || []
    }
  }

  return null
}

/**
 * Evaluate all published triage rules and create a triage run
 * @param {Object} intakeResponse - The IntakeResponse model instance
 * @param {Object} medicalProfile - The UserMedicalProfile model instance (can be null)
 * @returns {Object} - The created TriageRun instance
 */
async function evaluateTriageRules(intakeResponse, medicalProfile) {
  // Load all published triage rules
  const rules = await TriageRule.findAll({
    where: { status: 'published' },
    order: [['severity', 'DESC']] // Evaluate critical/high severity first
  })

  const intakeAnswers = intakeResponse.answers || {}
  const profileData = medicalProfile ? {
      conditions: medicalProfile.conditions || [],
      medications: medicalProfile.medications || [],
      allergies: medicalProfile.allergies || [],
      surgeries: medicalProfile.surgeries || [],
      pregnancyStatus: medicalProfile.pregnancyStatus,
      contraindications: medicalProfile.contraindications || []
    } : {}

  // Evaluate all rules
  const ruleHits = []
  let highestSeverity = 'low'
  let disposition = 'ok'
  const messages = []

  for (const rule of rules) {
    const hit = evaluateRule(rule, intakeAnswers, profileData)

    if (hit) {
      ruleHits.push({
        ruleId: hit.ruleId,
        ruleName: hit.ruleName,
        severity: hit.severity
      })

      // Update highest severity
      const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
      if (severityOrder[hit.severity] > severityOrder[highestSeverity]) {
        highestSeverity = hit.severity
      }

      // Process actions
      if (hit.actions && Array.isArray(hit.actions)) {
        for (const action of hit.actions) {
          if (action.type === 'set_disposition') {
            disposition = action.value || disposition
          }
          if (action.type === 'message') {
            messages.push(action.value || '')
          }
        }
      }
    }
  }

  // Determine final disposition based on severity
  if (highestSeverity === 'critical') {
    disposition = 'urgent_care'
  } else if (highestSeverity === 'high') {
    disposition = disposition === 'ok' ? 'book_consult' : disposition
  } else if (highestSeverity === 'medium') {
    disposition = disposition === 'ok' ? 'book_consult' : disposition
  }

  // Create triage run record
  const triageRun = await TriageRun.create({
    userId: intakeResponse.userId,
    intakeResponseId: intakeResponse.id,
    inputs: {
      intakeAnswers,
      medicalProfile: profileData
    },
    ruleHits,
    riskLevel: highestSeverity,
    disposition,
    messages: messages.length > 0 ? messages : [],
    createdByType: 'ai',
    createdBy: null
  })

  return triageRun
}

module.exports = {
  evaluateTriageRules,
  evaluateRule,
  evaluateCondition,
  getNestedValue
}

