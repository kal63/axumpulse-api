'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('UserWorkoutPlanProgress');
    if (tableDescription.fromGameId) {
      console.log('fromGameId column already exists in UserWorkoutPlanProgress table');
      return;
    }

    await queryInterface.addColumn('UserWorkoutPlanProgress', 'fromGameId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Games',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'ID of the game this workout plan was won from (for bonus XP)'
    });

    await queryInterface.addIndex('UserWorkoutPlanProgress', ['fromGameId'], {
      name: 'user_workout_plan_progress_from_game_id_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('UserWorkoutPlanProgress', 'user_workout_plan_progress_from_game_id_idx');
    await queryInterface.removeColumn('UserWorkoutPlanProgress', 'fromGameId');
  }
};

