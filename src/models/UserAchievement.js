'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class UserAchievement extends Model {
        static associate(models) {
            // Belongs to User
            UserAchievement.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            })

            // Belongs to Achievement
            UserAchievement.belongsTo(models.Achievement, {
                foreignKey: 'achievementId',
                as: 'achievement'
            })
        }
    }

    UserAchievement.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        achievementId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unlockedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'UserAchievement',
        tableName: 'UserAchievements',
        timestamps: true
    })

    return UserAchievement
}




