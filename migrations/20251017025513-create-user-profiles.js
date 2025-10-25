'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      // Activity & Progress
      totalXp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      challengesCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      workoutsCompleted: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },

      // Subscription
      subscriptionTier: {
        type: Sequelize.ENUM('premium', 'pro'),
        allowNull: false,
        defaultValue: 'premium'
      },
      subscriptionExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Preferences
      language: {
        type: Sequelize.STRING(5),
        allowNull: true,
        defaultValue: 'en'
      },
      notificationSettings: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },

      // Additional user-specific data
      fitnessGoals: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      healthMetrics: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      preferences: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_profiles');
  }
};
