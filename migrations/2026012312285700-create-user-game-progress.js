'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserGameProgress', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
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
      gameId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Games',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      xpEarned: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      gameData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint for user-game combination
    await queryInterface.addIndex('UserGameProgress', ['userId', 'gameId'], {
      unique: true,
      name: 'unique_user_game'
    });

    // Add indexes
    await queryInterface.addIndex('UserGameProgress', ['userId'], {
      name: 'user_game_progress_user_id'
    });
    await queryInterface.addIndex('UserGameProgress', ['gameId'], {
      name: 'user_game_progress_game_id'
    });
    await queryInterface.addIndex('UserGameProgress', ['completedAt'], {
      name: 'user_game_progress_completed_at'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('UserGameProgress', 'unique_user_game');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('UserGameProgress', 'user_game_progress_user_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('UserGameProgress', 'user_game_progress_game_id');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('UserGameProgress', 'user_game_progress_completed_at');
    } catch (e) {}

    await queryInterface.dropTable('UserGameProgress');
  }
};

