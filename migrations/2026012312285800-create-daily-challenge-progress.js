'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DailyChallengeProgress', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      challengeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Challenges',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      completionDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Track which day it was completed (date only, no time)'
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for user-challenge-date combination
    await queryInterface.addIndex('DailyChallengeProgress', ['userId', 'challengeId', 'completionDate'], {
      unique: true,
      name: 'unique_user_challenge_date'
    });

    // Add indexes
    await queryInterface.addIndex('DailyChallengeProgress', ['userId'], {
      name: 'daily_challenge_progress_user_id'
    });
    await queryInterface.addIndex('DailyChallengeProgress', ['challengeId'], {
      name: 'daily_challenge_progress_challenge_id'
    });
    await queryInterface.addIndex('DailyChallengeProgress', ['completionDate'], {
      name: 'daily_challenge_progress_completion_date'
    });
    await queryInterface.addIndex('DailyChallengeProgress', ['userId', 'completionDate'], {
      name: 'daily_challenge_progress_user_date'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('DailyChallengeProgress', 'unique_user_challenge_date');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('DailyChallengeProgress', 'daily_challenge_progress_user_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('DailyChallengeProgress', 'daily_challenge_progress_challenge_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('DailyChallengeProgress', 'daily_challenge_progress_completion_date');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('DailyChallengeProgress', 'daily_challenge_progress_user_date');
    } catch (e) {}

    await queryInterface.dropTable('DailyChallengeProgress');
  }
};

