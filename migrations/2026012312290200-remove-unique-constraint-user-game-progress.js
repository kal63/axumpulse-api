'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the unique constraint to allow multiple game plays per user
    try {
      await queryInterface.removeIndex('UserGameProgress', 'unique_user_game');
    } catch (e) {
      console.log('Index unique_user_game may not exist, continuing...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Re-add the unique constraint
    await queryInterface.addIndex('UserGameProgress', ['userId', 'gameId'], {
      unique: true,
      name: 'unique_user_game'
    });
  }
};

