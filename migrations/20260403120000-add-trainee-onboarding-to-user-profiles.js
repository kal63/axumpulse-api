'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const desc = await queryInterface.describeTable('user_profiles')
    if (!desc.traineeOnboardingCompletedAt) {
      await queryInterface.addColumn('user_profiles', 'traineeOnboardingCompletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      })
    }
  },

  async down(queryInterface) {
    const desc = await queryInterface.describeTable('user_profiles')
    if (desc.traineeOnboardingCompletedAt) {
      await queryInterface.removeColumn('user_profiles', 'traineeOnboardingCompletedAt')
    }
  }
}
