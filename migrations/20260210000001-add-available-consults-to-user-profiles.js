'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('user_profiles');
    
    // Add availableConsults column if it doesn't exist
    if (!tableDescription.availableConsults) {
      await queryInterface.addColumn('user_profiles', 'availableConsults', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Number of available consults the user has purchased'
      });
    } else {
      console.log('availableConsults column already exists in user_profiles table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_profiles', 'availableConsults');
  }
};

