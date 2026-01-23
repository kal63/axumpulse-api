'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add dailyChallengeStreak field
    await queryInterface.addColumn('user_profiles', 'dailyChallengeStreak', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });

    // Add lastDailyChallengeDate field
    await queryInterface.addColumn('user_profiles', 'lastDailyChallengeDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null
    });

    // Add index for streak queries
    await queryInterface.addIndex('user_profiles', ['dailyChallengeStreak'], {
      name: 'user_profiles_daily_challenge_streak'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    try {
      await queryInterface.removeIndex('user_profiles', 'user_profiles_daily_challenge_streak');
    } catch (e) {}

    // Remove columns
    await queryInterface.removeColumn('user_profiles', 'lastDailyChallengeDate');
    await queryInterface.removeColumn('user_profiles', 'dailyChallengeStreak');
  }
};

