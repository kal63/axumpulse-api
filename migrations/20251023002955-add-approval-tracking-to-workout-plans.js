'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check which columns already exist
    const tableInfo = await queryInterface.describeTable('WorkoutPlans');

    // Add approval tracking fields to WorkoutPlans table
    if (!tableInfo.rejectionReason) {
      await queryInterface.addColumn('WorkoutPlans', 'rejectionReason', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    if (!tableInfo.approvedBy) {
      await queryInterface.addColumn('WorkoutPlans', 'approvedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableInfo.approvedAt) {
      await queryInterface.addColumn('WorkoutPlans', 'approvedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    if (!tableInfo.rejectedBy) {
      await queryInterface.addColumn('WorkoutPlans', 'rejectedBy', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableInfo.rejectedAt) {
      await queryInterface.addColumn('WorkoutPlans', 'rejectedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check which columns exist before removing
    const tableInfo = await queryInterface.describeTable('WorkoutPlans');

    if (tableInfo.rejectionReason) {
      await queryInterface.removeColumn('WorkoutPlans', 'rejectionReason');
    }
    if (tableInfo.approvedBy) {
      await queryInterface.removeColumn('WorkoutPlans', 'approvedBy');
    }
    if (tableInfo.approvedAt) {
      await queryInterface.removeColumn('WorkoutPlans', 'approvedAt');
    }
    if (tableInfo.rejectedBy) {
      await queryInterface.removeColumn('WorkoutPlans', 'rejectedBy');
    }
    if (tableInfo.rejectedAt) {
      await queryInterface.removeColumn('WorkoutPlans', 'rejectedAt');
    }
  }
};
