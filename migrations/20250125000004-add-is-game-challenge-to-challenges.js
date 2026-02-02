'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('Challenges');
    if (tableDescription.isGameChallenge) {
      console.log('isGameChallenge column already exists in Challenges table');
      return;
    }

    await queryInterface.addColumn('Challenges', 'isGameChallenge', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this challenge is available for use in games (spin & win)'
    });

    // Add index for better query performance
    await queryInterface.addIndex('Challenges', ['isGameChallenge'], {
      name: 'challenges_is_game_challenge_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Challenges', 'challenges_is_game_challenge_idx');
    await queryInterface.removeColumn('Challenges', 'isGameChallenge');
  }
};

