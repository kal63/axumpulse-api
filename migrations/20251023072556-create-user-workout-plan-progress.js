'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserWorkoutPlanProgress', {
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
      workoutPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'WorkoutPlans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('active', 'completed', 'paused'),
        defaultValue: 'active'
      },
      startedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastAccessedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedExercises: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalExercises: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('UserWorkoutPlanProgress', ['userId', 'workoutPlanId'], {
      unique: true,
      name: 'unique_user_workout_plan'
    });

    // Add indexes
    await queryInterface.addIndex('UserWorkoutPlanProgress', ['userId']);
    await queryInterface.addIndex('UserWorkoutPlanProgress', ['workoutPlanId']);
    await queryInterface.addIndex('UserWorkoutPlanProgress', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserWorkoutPlanProgress');
  }
};