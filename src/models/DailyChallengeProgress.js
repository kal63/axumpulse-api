'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DailyChallengeProgress extends Model {
        static associate(models) {
            // Belongs to User
            DailyChallengeProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });

            // Belongs to Challenge
            DailyChallengeProgress.belongsTo(models.Challenge, {
                foreignKey: 'challengeId',
                as: 'challenge'
            });
        }
    }

    DailyChallengeProgress.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        challengeId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        completionDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Track which day it was completed (date only, no time)'
        },
        xpEarned: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'DailyChallengeProgress',
        tableName: 'DailyChallengeProgress',
        timestamps: true
    });

    return DailyChallengeProgress;
};

