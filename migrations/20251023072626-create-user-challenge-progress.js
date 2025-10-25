'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserChallengeProgress', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      status: {
        type: Sequelize.ENUM('active', 'completed', 'failed'),
        defaultValue: 'active'
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Current progress value'
      },
      joinedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      rank: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Final ranking in challenge'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint
    await queryInterface.addIndex('UserChallengeProgress', ['userId', 'challengeId'], {
      unique: true,
      name: 'unique_user_challenge'
    });

    // Add indexes
    await queryInterface.addIndex('UserChallengeProgress', ['userId']);
    await queryInterface.addIndex('UserChallengeProgress', ['challengeId']);
    await queryInterface.addIndex('UserChallengeProgress', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserChallengeProgress');
  }
};