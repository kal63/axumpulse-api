'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Contents', 'workoutPlanId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'WorkoutPlans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Contents', 'workoutPlanId');
  }
};