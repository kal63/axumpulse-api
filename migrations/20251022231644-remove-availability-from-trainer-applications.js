'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Checking if availability column exists...');

    const tableInfo = await queryInterface.describeTable('TrainerApplications');

    if (tableInfo.availability) {
      console.log('Removing availability column from TrainerApplications...');
      await queryInterface.removeColumn('TrainerApplications', 'availability');
      console.log('Availability column removed successfully!');
    } else {
      console.log('Availability column does not exist, skipping removal.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Checking if availability column exists...');

    const tableInfo = await queryInterface.describeTable('TrainerApplications');

    if (!tableInfo.availability) {
      console.log('Adding back availability column to TrainerApplications...');
      await queryInterface.addColumn('TrainerApplications', 'availability', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      });
      console.log('Availability column added back!');
    } else {
      console.log('Availability column already exists, skipping addition.');
    }
  }
};
