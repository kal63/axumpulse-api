'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add isDailyChallenge field
    await queryInterface.addColumn('Challenges', 'isDailyChallenge', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Add fitnessLevel field (separate from difficulty)
    await queryInterface.addColumn('Challenges', 'fitnessLevel', {
      type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: true,
      defaultValue: null
    });

    // Add recurrencePattern field (JSON)
    await queryInterface.addColumn('Challenges', 'recurrencePattern', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null
    });

    // Add autoAssign field
    await queryInterface.addColumn('Challenges', 'autoAssign', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    // Add indexes for daily challenge queries
    await queryInterface.addIndex('Challenges', ['isDailyChallenge'], {
      name: 'challenges_is_daily_challenge'
    });
    await queryInterface.addIndex('Challenges', ['fitnessLevel'], {
      name: 'challenges_fitness_level'
    });
    await queryInterface.addIndex('Challenges', ['isDailyChallenge', 'fitnessLevel'], {
      name: 'challenges_daily_fitness_level'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('Challenges', 'challenges_is_daily_challenge');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('Challenges', 'challenges_fitness_level');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('Challenges', 'challenges_daily_fitness_level');
    } catch (e) {}

    // Remove columns
    await queryInterface.removeColumn('Challenges', 'autoAssign');
    await queryInterface.removeColumn('Challenges', 'recurrencePattern');
    await queryInterface.removeColumn('Challenges', 'fitnessLevel');
    await queryInterface.removeColumn('Challenges', 'isDailyChallenge');
  }
};

