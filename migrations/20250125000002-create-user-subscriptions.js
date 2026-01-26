'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_subscriptions', {
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
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      trainerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      subscriptionPlanId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'subscription_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      duration: {
        type: Sequelize.ENUM('daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly'),
        allowNull: false
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      lastPaymentReference: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex('user_subscriptions', ['userId'], {
      name: 'user_subscriptions_user_id_idx'
    });

    await queryInterface.addIndex('user_subscriptions', ['trainerId'], {
      name: 'user_subscriptions_trainer_id_idx'
    });

    await queryInterface.addIndex('user_subscriptions', ['status'], {
      name: 'user_subscriptions_status_idx'
    });

    await queryInterface.addIndex('user_subscriptions', ['expiresAt'], {
      name: 'user_subscriptions_expires_at_idx'
    });

    await queryInterface.addIndex('user_subscriptions', ['userId', 'status'], {
      name: 'user_subscriptions_user_status_idx'
    });

    await queryInterface.addIndex('user_subscriptions', ['userId', 'trainerId', 'status'], {
      name: 'user_subscriptions_user_trainer_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_subscriptions');
  }
};

