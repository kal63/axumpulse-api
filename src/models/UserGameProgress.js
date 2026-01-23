'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserGameProgress extends Model {
        static associate(models) {
            // Belongs to User
            UserGameProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });

            // Belongs to Game
            UserGameProgress.belongsTo(models.Game, {
                foreignKey: 'gameId',
                as: 'game'
            });
        }
    }

    UserGameProgress.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        gameId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        xpEarned: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        gameData: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        sequelize,
        modelName: 'UserGameProgress',
        tableName: 'UserGameProgress',
        timestamps: true
    });

    // Override toJSON to parse JSON fields that might be returned as strings
    UserGameProgress.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        const jsonFields = ['gameData'];

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field]);
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field]);
                    values[field] = {};
                }
            }
        });

        return values;
    };

    return UserGameProgress;
};

