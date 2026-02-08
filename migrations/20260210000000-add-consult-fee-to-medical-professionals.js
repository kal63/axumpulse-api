'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('medical_professionals');
    
    // Add consultFee column if it doesn't exist
    if (!tableDescription.consultFee) {
      await queryInterface.addColumn('medical_professionals', 'consultFee', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        comment: 'Consultation fee charged by the medical professional'
      });
    } else {
      console.log('consultFee column already exists in medical_professionals table');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('medical_professionals', 'consultFee');
  }
};

