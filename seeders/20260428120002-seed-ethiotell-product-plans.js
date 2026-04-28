'use strict'

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date()
    const planRows = await queryInterface.sequelize.query(
      'SELECT id FROM subscription_plans WHERE active = 1 ORDER BY id ASC LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    )
    const trainerRows = await queryInterface.sequelize.query(
      'SELECT userId FROM trainers WHERE verified = 1 ORDER BY id ASC LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    )
    const plan = planRows[0]
    const trainerRow = trainerRows[0]
    if (!plan || !trainerRow) {
      console.warn('[seed ethiotell_product_plans] Skipping: need at least one subscription_plan and one verified trainer')
      return
    }
    const subscriptionPlanId = plan.id
    const trainerId = trainerRow.userId

    await queryInterface.bulkInsert('ethiotell_product_plans', [
      {
        productCode: 'DEFAULT_MONTHLY',
        subscriptionPlanId,
        trainerId,
        duration: 'monthly',
        label: 'Default Ethiotell SKU (adjust productCode mapping in admin/DB)',
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ])
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('ethiotell_product_plans', { productCode: 'DEFAULT_MONTHLY' }, {})
  }
}
