'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the workoutPlanId column from Contents table
    await queryInterface.removeColumn('Contents', 'workoutPlanId');
  },

  async down(queryInterface, Sequelize) {
    // Add back the workoutPlanId column to Contents table
    await queryInterface.addColumn('Contents', 'workoutPlanId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'WorkoutPlans',
        key: 'id'
      }
    });
  }
};
