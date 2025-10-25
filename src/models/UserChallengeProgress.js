'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class UserChallengeProgress extends Model {
        static associate(models) {
            // Belongs to User
            UserChallengeProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            })

            // Belongs to Challenge
            UserChallengeProgress.belongsTo(models.Challenge, {
                foreignKey: 'challengeId',
                as: 'challenge'
            })
        }
    }

    UserChallengeProgress.init({
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
        status: {
            type: DataTypes.ENUM('active', 'completed', 'failed'),
            defaultValue: 'active'
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Current progress value'
        },
        joinedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        xpEarned: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        rank: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Final ranking in challenge'
        }
    }, {
        sequelize,
        modelName: 'UserChallengeProgress',
        tableName: 'UserChallengeProgress',
        timestamps: true
    })

    return UserChallengeProgress
}




