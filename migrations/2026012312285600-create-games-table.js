'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Games', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      gameType: {
        type: Sequelize.ENUM('spin_win', 'quiz_battle', 'memory_game'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      configJson: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      xpReward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: true,
        defaultValue: 'beginner'
      },
      useAiGeneration: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      aiPromptTemplate: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      cachedContent: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null
      },
      cacheExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('Games', ['gameType'], {
      name: 'games_game_type'
    });
    await queryInterface.addIndex('Games', ['active'], {
      name: 'games_active'
    });
    await queryInterface.addIndex('Games', ['difficulty'], {
      name: 'games_difficulty'
    });
    await queryInterface.addIndex('Games', ['gameType', 'active'], {
      name: 'games_type_active'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    try {
      await queryInterface.removeIndex('Games', 'games_game_type');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('Games', 'games_active');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('Games', 'games_difficulty');
    } catch (e) {}
    try {
      await queryInterface.removeIndex('Games', 'games_type_active');
    } catch (e) {}

    await queryInterface.dropTable('Games');
  }
};

