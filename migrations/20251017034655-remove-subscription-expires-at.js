'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove subscriptionExpiresAt column from user_profiles table
    await queryInterface.removeColumn('user_profiles', 'subscriptionExpiresAt');
  },

  async down(queryInterface, Sequelize) {
    // Add back subscriptionExpiresAt column if migration is reverted
    await queryInterface.addColumn('user_profiles', 'subscriptionExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  }
};
