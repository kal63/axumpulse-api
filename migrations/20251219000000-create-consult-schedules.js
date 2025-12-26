'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consult_schedules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      providerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      dayOfWeek: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday'
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: 'Slot duration in minutes'
      },
      type: {
        type: Sequelize.ENUM('quick', 'full', 'follow_up'),
        allowNull: false,
        defaultValue: 'quick'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      timezone: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('consult_schedules', ['providerId'], {
      name: 'consult_schedules_provider_id_idx'
    });
    await queryInterface.addIndex('consult_schedules', ['dayOfWeek'], {
      name: 'consult_schedules_day_of_week_idx'
    });
    await queryInterface.addIndex('consult_schedules', ['status'], {
      name: 'consult_schedules_status_idx'
    });
    await queryInterface.addIndex('consult_schedules', ['providerId', 'dayOfWeek'], {
      name: 'consult_schedules_provider_day_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('consult_schedules');
  }
};

