'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      level: {
        type: Sequelize.ENUM('silver', 'gold', 'diamond', 'platinum'),
        allowNull: false
      },
      dailyPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      monthlyPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      threeMonthPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      sixMonthPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      nineMonthPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      yearlyPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      discounts: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      minDuration: {
        type: Sequelize.ENUM('daily', 'monthly', 'threeMonth'),
        allowNull: false,
        defaultValue: 'daily'
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    await queryInterface.addIndex('subscription_plans', ['level'], {
      name: 'subscription_plans_level_idx'
    });

    await queryInterface.addIndex('subscription_plans', ['active'], {
      name: 'subscription_plans_active_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscription_plans');
  }
};

