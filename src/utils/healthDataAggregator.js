'use strict'

const { HealthDataPoint, HealthDataRollup } = require('../models')
const { Op } = require('sequelize')

/**
 * Aggregate health data points into rollups
 * @param {number} userId - User ID
 * @param {string} metric - Metric type (hr, bp_systolic, etc.)
 * @param {string} period - Period type ('daily', 'weekly', 'monthly')
 * @param {Date} startDate - Start date for aggregation
 * @param {Date} endDate - End date for aggregation
 * @returns {Promise<Array>} - Array of rollup records
 */
async function aggregateHealthData(userId, metric, period = 'daily', startDate, endDate) {
  const where = { userId }
  if (metric) where.metric = metric
  if (startDate || endDate) {
    where.capturedAt = {}
    if (startDate) where.capturedAt[Op.gte] = startDate
    if (endDate) where.capturedAt[Op.lte] = endDate
  }

  // Get all data points
  const dataPoints = await HealthDataPoint.findAll({
    where,
    order: [['capturedAt', 'ASC']]
  })

  if (dataPoints.length === 0) {
    return []
  }

  // Group by period
  const rollups = new Map()

  for (const point of dataPoints) {
    const date = new Date(point.capturedAt)
    let periodKey

    let periodDate
    if (period === 'daily') {
      periodDate = date.toISOString().split('T')[0] // YYYY-MM-DD
    } else if (period === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      periodDate = weekStart.toISOString().split('T')[0]
    } else if (period === 'monthly') {
      periodDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01` // YYYY-MM-01
    } else {
      periodDate = date.toISOString().split('T')[0] // Default to daily
    }

    if (!rollups.has(periodDate)) {
      rollups.set(periodDate, {
        periodDate: new Date(periodDate),
        metric: point.metric,
        values: [],
        count: 0,
        sum: 0,
        min: null,
        max: null
      })
    }

    const periodKey = periodDate

    const rollup = rollups.get(periodKey)
    const value = Number(point.value)
    rollup.values.push(value)
    rollup.count++
    rollup.sum += value
    if (rollup.min === null || value < rollup.min) rollup.min = value
    if (rollup.max === null || value > rollup.max) rollup.max = value
  }

  // Calculate averages and create/update rollup records
  const rollupRecords = []

  for (const [periodKey, rollup] of rollups.entries()) {
    const avg = rollup.sum / rollup.count

    // Prepare aggregated data for agg JSON field
    const aggData = {
      avg: avg,
      min: rollup.min,
      max: rollup.max,
      count: rollup.count,
      sum: rollup.sum
    }

    // Find or create rollup record
    const [rollupRecord, created] = await HealthDataRollup.findOrCreate({
      where: {
        userId,
        metric: rollup.metric,
        periodDate: rollup.periodDate
      },
      defaults: {
        userId,
        metric: rollup.metric,
        periodDate: rollup.periodDate,
        agg: aggData
      }
    })

    if (!created) {
      await rollupRecord.update({
        agg: aggData
      })
    }

    rollupRecords.push(rollupRecord)
  }

  return rollupRecords
}

/**
 * Generate rollups for all metrics for a user
 * @param {number} userId - User ID
 * @param {string} period - Period type
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} - Array of all rollup records
 */
async function aggregateAllMetrics(userId, period = 'daily', startDate, endDate) {
  const metrics = ['hr', 'bp_systolic', 'bp_diastolic', 'glucose', 'sleep', 'steps', 'hrv', 'weight']
  const allRollups = []

  for (const metric of metrics) {
    const rollups = await aggregateHealthData(userId, metric, period, startDate, endDate)
    allRollups.push(...rollups)
  }

  return allRollups
}

module.exports = {
  aggregateHealthData,
  aggregateAllMetrics
}

