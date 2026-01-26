'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payment_transactions', {
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
      subscriptionPlanId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'subscription_plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      trainerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      txRef: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      chapaRefId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'ETB'
      },
      status: {
        type: Sequelize.ENUM('pending', 'success', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: Sequelize.ENUM('card', 'telebirr', 'cbebirr', 'awashbirr', 'bank', 'mpesa', 'other'),
        allowNull: true
      },
      customerEmail: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      customerName: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      customerPhone: {
        type: Sequelize.STRING(32),
        allowNull: true
      },
      callbackData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verificationData: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('payment_transactions', ['txRef'], {
      unique: true,
      name: 'payment_transactions_tx_ref_unique'
    });

    await queryInterface.addIndex('payment_transactions', ['chapaRefId'], {
      unique: true,
      name: 'payment_transactions_chapa_ref_id_unique'
    });

    await queryInterface.addIndex('payment_transactions', ['userId'], {
      name: 'payment_transactions_user_id_idx'
    });

    await queryInterface.addIndex('payment_transactions', ['status'], {
      name: 'payment_transactions_status_idx'
    });

    await queryInterface.addIndex('payment_transactions', ['userId', 'status'], {
      name: 'payment_transactions_user_status_idx'
    });

    await queryInterface.addIndex('payment_transactions', ['status', 'createdAt'], {
      name: 'payment_transactions_status_created_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payment_transactions');
  }
};

