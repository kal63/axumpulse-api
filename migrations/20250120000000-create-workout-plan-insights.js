'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('WorkoutPlanInsights', {
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
      insightText: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      customLabels: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      suitability: {
        type: Sequelize.ENUM('recommended', 'caution', 'not_recommended', 'requires_modification'),
        allowNull: false,
        defaultValue: 'recommended'
      },
      medicalContext: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      sourceType: {
        type: Sequelize.ENUM('ai', 'medical_professional', 'ai_edited'),
        allowNull: false,
        defaultValue: 'medical_professional'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      generatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    // Composite unique index on (userId, workoutPlanId) - ensures no duplicate insights per user per plan
    await queryInterface.addIndex('WorkoutPlanInsights', ['userId', 'workoutPlanId'], {
      unique: true,
      name: 'unique_user_workout_plan_insight'
    });

    // Indexes for efficient queries
    await queryInterface.addIndex('WorkoutPlanInsights', ['userId'], {
      name: 'idx_workout_plan_insights_user_id'
    });

    await queryInterface.addIndex('WorkoutPlanInsights', ['workoutPlanId'], {
      name: 'idx_workout_plan_insights_workout_plan_id'
    });

    await queryInterface.addIndex('WorkoutPlanInsights', ['createdBy'], {
      name: 'idx_workout_plan_insights_created_by'
    });

    await queryInterface.addIndex('WorkoutPlanInsights', ['suitability'], {
      name: 'idx_workout_plan_insights_suitability'
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop indexes first
    await queryInterface.removeIndex('WorkoutPlanInsights', 'idx_workout_plan_insights_suitability');
    await queryInterface.removeIndex('WorkoutPlanInsights', 'idx_workout_plan_insights_created_by');
    await queryInterface.removeIndex('WorkoutPlanInsights', 'idx_workout_plan_insights_workout_plan_id');
    await queryInterface.removeIndex('WorkoutPlanInsights', 'idx_workout_plan_insights_user_id');
    await queryInterface.removeIndex('WorkoutPlanInsights', 'unique_user_workout_plan_insight');
    
    await queryInterface.dropTable('WorkoutPlanInsights');
  }
};

