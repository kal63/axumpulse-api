'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserContentProgress', {
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
      contentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Contents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      watchTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Watch time in seconds'
      },
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      liked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      saved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
    await queryInterface.addIndex('UserContentProgress', ['userId', 'contentId'], {
      unique: true,
      name: 'unique_user_content'
    });

    // Add indexes for queries
    await queryInterface.addIndex('UserContentProgress', ['userId']);
    await queryInterface.addIndex('UserContentProgress', ['contentId']);
    await queryInterface.addIndex('UserContentProgress', ['completed']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserContentProgress');
  }
};