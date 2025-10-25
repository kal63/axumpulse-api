'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Grandfather existing trainers - set them as verified
    await queryInterface.sequelize.query(`
      UPDATE Trainers 
      SET verified = true, 
          verifiedAt = NOW() 
      WHERE verified = false
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert grandfathering - set all trainers back to unverified
    await queryInterface.sequelize.query(`
      UPDATE Trainers 
      SET verified = false, 
          verifiedAt = NULL 
      WHERE verified = true
    `);
  }
};
