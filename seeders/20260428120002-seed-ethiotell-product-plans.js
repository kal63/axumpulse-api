'use strict'

/** @type {import('sequelize-cli').Seeder} */

const DURATIONS = ['daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly']

/**
 * Match subscription plan `minDuration` (what the app allows as minimum term).
 * Ethiotell SKUs only for durations that are valid for that plan.
 */
function durationsForPlan(plan) {
  const min = plan.minDuration || 'daily'
  if (min === 'daily') return [...DURATIONS]
  if (min === 'monthly') return DURATIONS.filter((d) => d !== 'daily')
  if (min === 'threeMonth') return DURATIONS.filter((d) => d !== 'daily' && d !== 'monthly')
  return [...DURATIONS]
}

const DURATION_CODE = {
  daily: 'DAILY',
  monthly: 'MONTHLY',
  threeMonth: 'THREE_M',
  sixMonth: 'SIX_M',
  nineMonth: 'NINE_M',
  yearly: 'YEARLY',
}

/** Stable product code for Ethiotell `planinfo` (uppercase, no spaces). */
function productCodeFor(plan, duration) {
  const level = String(plan.level || 'plan').toUpperCase()
  const dur = DURATION_CODE[duration] || String(duration).toUpperCase()
  return `ET6313_${level}_${dur}`
}

function labelFor(plan, duration) {
  return `${plan.name} — ${duration} (plan id ${plan.id})`
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()

    const plans = await queryInterface.sequelize.query(
      'SELECT id, name, level, minDuration, active FROM subscription_plans WHERE active = 1 ORDER BY id ASC',
      { type: Sequelize.QueryTypes.SELECT }
    )
    if (!plans.length) {
      console.warn('[seed ethiotell_product_plans] No active subscription_plans; skipping')
      return
    }

    let trainerId = null
    try {
      const trainerRows = await queryInterface.sequelize.query(
        'SELECT userId FROM trainers WHERE verified = 1 ORDER BY id ASC LIMIT 1',
        { type: Sequelize.QueryTypes.SELECT }
      )
      if (trainerRows[0]) trainerId = trainerRows[0].userId
    } catch {
      /* trainers table may not exist */
    }
    if (!trainerId) {
      const userRows = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE isTrainer = 1 ORDER BY id ASC LIMIT 1',
        { type: Sequelize.QueryTypes.SELECT }
      )
      if (userRows[0]) trainerId = userRows[0].id
    }
    if (!trainerId) {
      console.warn('[seed ethiotell_product_plans] No trainer user; skipping')
      return
    }

    const rows = []
    for (const plan of plans) {
      for (const duration of durationsForPlan(plan)) {
        rows.push({
          productCode: productCodeFor(plan, duration),
          subscriptionPlanId: plan.id,
          trainerId,
          duration,
          label: labelFor(plan, duration),
          active: true,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    // Idempotent: remove SKUs we own, then insert fresh (safe when plans/durations change)
    const codes = rows.map((r) => r.productCode)
    await queryInterface.bulkDelete('ethiotell_product_plans', { productCode: codes }, {})
    await queryInterface.bulkInsert('ethiotell_product_plans', rows, {})
    console.log(`[seed ethiotell_product_plans] Inserted ${rows.length} SKU(s): ${codes.join(', ')}`)
  },

  async down(queryInterface, Sequelize) {
    const plans = await queryInterface.sequelize.query(
      'SELECT id, level, minDuration FROM subscription_plans WHERE active = 1 ORDER BY id ASC',
      { type: Sequelize.QueryTypes.SELECT }
    )
    const codes = []
    for (const plan of plans) {
      for (const duration of durationsForPlan(plan)) {
        codes.push(productCodeFor(plan, duration))
      }
    }
    if (codes.length) {
      await queryInterface.bulkDelete('ethiotell_product_plans', { productCode: codes }, {})
    }
    await queryInterface.bulkDelete('ethiotell_product_plans', { productCode: 'DEFAULT_MONTHLY' }, {})
  },
}
