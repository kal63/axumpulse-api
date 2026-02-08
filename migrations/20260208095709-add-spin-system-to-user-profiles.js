'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('user_profiles');
    
    // Add availableSpins column if it doesn't exist
    if (!tableDescription.availableSpins) {
      await queryInterface.addColumn('user_profiles', 'availableSpins', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Current count of available spins (unlimited accumulation)'
      });
    } else {
      console.log('availableSpins column already exists in user_profiles table');
    }

    // Add lastSpinAccrualDate column if it doesn't exist
    if (!tableDescription.lastSpinAccrualDate) {
      await queryInterface.addColumn('user_profiles', 'lastSpinAccrualDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        comment: 'Last date when spins were accrued (used to calculate missed days)'
      });
    } else {
      console.log('lastSpinAccrualDate column already exists in user_profiles table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'lastSpinAccrualDate');
    await queryInterface.removeColumn('user_profiles', 'availableSpins');
  }
};

