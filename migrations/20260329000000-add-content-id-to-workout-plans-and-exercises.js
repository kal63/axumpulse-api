'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('WorkoutPlans', 'contentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Contents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addColumn('WorkoutExercises', 'contentId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Contents',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    await queryInterface.addIndex('WorkoutPlans', ['contentId'], {
      name: 'workout_plans_content_id_idx'
    });
    await queryInterface.addIndex('WorkoutExercises', ['contentId'], {
      name: 'workout_exercises_content_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('WorkoutExercises', 'workout_exercises_content_id_idx');
    await queryInterface.removeIndex('WorkoutPlans', 'workout_plans_content_id_idx');
    await queryInterface.removeColumn('WorkoutExercises', 'contentId');
    await queryInterface.removeColumn('WorkoutPlans', 'contentId');
  }
};
