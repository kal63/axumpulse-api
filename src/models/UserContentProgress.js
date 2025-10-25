'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class UserContentProgress extends Model {
        static associate(models) {
            // Belongs to User
            UserContentProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            })

            // Belongs to Content
            UserContentProgress.belongsTo(models.Content, {
                foreignKey: 'contentId',
                as: 'content'
            })
        }
    }

    UserContentProgress.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        contentId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        watchTime: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Watch time in seconds'
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        xpEarned: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        liked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        saved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'UserContentProgress',
        tableName: 'UserContentProgress',
        timestamps: true
    })

    return UserContentProgress
}



