'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ethiotell_product_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      productCode: {
        type: Sequelize.STRING(128),
        allowNull: false,
        unique: true
      },
      subscriptionPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'subscription_plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      trainerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      duration: {
        type: Sequelize.ENUM('daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly'),
        allowNull: false
      },
      label: {
        type: Sequelize.STRING(255),
        allowNull: true
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
    })

    await queryInterface.addIndex('ethiotell_product_plans', ['active'], {
      name: 'ethiotell_product_plans_active_idx'
    })

    await queryInterface.createTable('telco_pending_registrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      phone: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      productCode: {
        type: Sequelize.STRING(128),
        allowNull: false
      },
      subscriptionPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'subscription_plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      trainerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      duration: {
        type: Sequelize.ENUM('daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly'),
        allowNull: false
      },
      rawPayload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      consumedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      },
      consumedUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })

    await queryInterface.addIndex('telco_pending_registrations', ['consumedAt'], {
      name: 'telco_pending_registrations_consumed_at_idx'
    })
  },

  async down(queryInterface) {
    await queryInterface.dropTable('telco_pending_registrations')
    await queryInterface.dropTable('ethiotell_product_plans')
  }
}
