'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Achievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      icon: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Icon name or emoji'
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        defaultValue: 'common'
      },
      xpReward: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      criteria: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Achievement criteria as JSON'
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

    // Add indexes
    await queryInterface.addIndex('Achievements', ['rarity']);
    await queryInterface.addIndex('Achievements', ['name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Achievements');
  }
};