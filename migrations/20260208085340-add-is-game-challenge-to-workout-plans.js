'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('WorkoutPlans');
    if (tableDescription.isGameChallenge) {
      console.log('isGameChallenge column already exists in WorkoutPlans table');
      return;
    }

    await queryInterface.addColumn('WorkoutPlans', 'isGameChallenge', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this workout plan is available for use in games (spin & win)'
    });

    // Add index for better query performance
    await queryInterface.addIndex('WorkoutPlans', ['isGameChallenge'], {
      name: 'workout_plans_is_game_challenge_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('WorkoutPlans', 'workout_plans_is_game_challenge_idx');
    await queryInterface.removeColumn('WorkoutPlans', 'isGameChallenge');
  }
};

