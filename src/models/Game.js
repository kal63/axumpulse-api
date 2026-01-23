'use strict';

module.exports = (sequelize, DataTypes) => {
    const Game = sequelize.define('Game', {
        gameType: {
            type: DataTypes.ENUM('spin_win', 'quiz_battle', 'memory_game'),
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        configJson: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        xpReward: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 50,
            validate: {
                min: 0
            }
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: true,
            defaultValue: 'beginner'
        },
        useAiGeneration: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        aiPromptTemplate: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        cachedContent: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },
        cacheExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'Games',
        underscored: false,
        indexes: [
            {
                fields: ['gameType']
            },
            {
                fields: ['active']
            },
            {
                fields: ['difficulty']
            },
            {
                fields: ['gameType', 'active']
            }
        ]
    });

    Game.associate = (models) => {
        Game.hasMany(models.UserGameProgress, {
            foreignKey: 'gameId',
            as: 'userProgress'
        });
    };

    // Override toJSON to parse JSON fields that might be returned as strings
    Game.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        const jsonFields = ['configJson', 'cachedContent'];

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field]);
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field]);
                    values[field] = field === 'cachedContent' ? null : {};
                }
            }
        });

        return values;
    };

    return Game;
};

