'use strict'

const { HealthAlert, HealthDataPoint } = require('../models')
const { Op } = require('sequelize')

/**
 * Check health data point against thresholds and create alerts if needed
 * @param {number} userId - User ID
 * @param {Object} healthDataPoint - HealthDataPoint model instance
 * @returns {Promise<HealthAlert|null>} - Created alert or null
 */
async function checkAndCreateAlerts(userId, healthDataPoint) {
  const { metric, value } = healthDataPoint

  // Define thresholds for different metrics
  const thresholds = {
    hr: {
      high: 100,
      low: 60,
      critical_high: 120,
      critical_low: 50
    },
    bp_systolic: {
      high: 140,
      low: 90,
      critical_high: 180,
      critical_low: 80
    },
    bp_diastolic: {
      high: 90,
      low: 60,
      critical_high: 120,
      critical_low: 50
    },
    glucose: {
      high: 140, // mg/dL
      low: 70,
      critical_high: 200,
      critical_low: 54
    },
    sleep: {
      low: 6, // hours
      critical_low: 4
    },
    steps: {
      low: 5000, // per day
      critical_low: 2000
    }
  }

  const metricThresholds = thresholds[metric]
  if (!metricThresholds) {
    return null // No thresholds defined for this metric
  }

  const numValue = Number(value)
  let severity = 'info'
  let message = ''
  let shouldCreateAlert = false

  // Check for critical conditions
  if (metricThresholds.critical_high && numValue >= metricThresholds.critical_high) {
    severity = 'high'
    message = `Critical: ${metric} reading of ${value} exceeds critical threshold (${metricThresholds.critical_high}). Please seek immediate medical attention.`
    shouldCreateAlert = true
  } else if (metricThresholds.critical_low && numValue <= metricThresholds.critical_low) {
    severity = 'high'
    message = `Critical: ${metric} reading of ${value} is below critical threshold (${metricThresholds.critical_low}). Please seek immediate medical attention.`
    shouldCreateAlert = true
  } else if (metricThresholds.high && numValue >= metricThresholds.high) {
    severity = 'warn'
    message = `Warning: ${metric} reading of ${value} is above normal threshold (${metricThresholds.high}). Consider consulting with a medical professional.`
    shouldCreateAlert = true
  } else if (metricThresholds.low && numValue <= metricThresholds.low) {
    severity = 'warn'
    message = `Warning: ${metric} reading of ${value} is below normal threshold (${metricThresholds.low}). Consider consulting with a medical professional.`
    shouldCreateAlert = true
  }

  if (!shouldCreateAlert) {
    return null
  }

  // Check if similar alert already exists (within last 24 hours)
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  const existingAlert = await HealthAlert.findOne({
    where: {
      userId,
      triggerSource: 'threshold',
      severity,
      status: { [Op.in]: ['open', 'ack'] },
      message: { [Op.like]: `%${metric}%` },
      createdAt: { [Op.gte]: oneDayAgo }
    }
  })

  if (existingAlert) {
    return null // Don't create duplicate alert
  }

  // Create alert
  const alert = await HealthAlert.create({
    userId,
    triggerSource: 'threshold',
    severity,
    message,
    status: 'open',
    assignedTo: null
  })

  return alert
}

/**
 * Create a manual alert
 * @param {number} userId - User ID
 * @param {string} message - Alert message
 * @param {string} severity - Alert severity ('info', 'warn', 'high')
 * @param {number} assignedTo - Medical professional ID to assign to (optional)
 * @returns {Promise<HealthAlert>} - Created alert
 */
async function createManualAlert(userId, message, severity = 'info', assignedTo = null) {
  const alert = await HealthAlert.create({
    userId,
    triggerSource: 'manual',
    severity,
    message,
    status: 'open',
    assignedTo
  })

  return alert
}

/**
 * Create alert from triage run
 * @param {number} userId - User ID
 * @param {Object} triageRun - TriageRun model instance
 * @returns {Promise<HealthAlert|null>} - Created alert or null
 */
async function createAlertFromTriage(userId, triageRun) {
  if (triageRun.riskLevel === 'low' && triageRun.disposition === 'ok') {
    return null // No alert needed for low risk
  }

  let severity = 'info'
  if (triageRun.riskLevel === 'critical') severity = 'high'
  else if (triageRun.riskLevel === 'high') severity = 'warn'

  const messages = triageRun.messages || []
  const message = messages.length > 0
    ? messages.join(' ')
    : `Triage assessment: ${triageRun.riskLevel} risk level. Disposition: ${triageRun.disposition}`

  const alert = await HealthAlert.create({
    userId,
    triggerSource: 'triage',
    severity,
    message,
    status: 'open',
    assignedTo: null
  })

  return alert
}

module.exports = {
  checkAndCreateAlerts,
  createManualAlert,
  createAlertFromTriage
}

