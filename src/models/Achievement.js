'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class Achievement extends Model {
        static associate(models) {
            // Has many UserAchievements
            Achievement.hasMany(models.UserAchievement, {
                foreignKey: 'achievementId',
                as: 'userAchievements'
            })
        }

        // Override toJSON to parse JSON fields that might be returned as strings
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            if (values.criteria && typeof values.criteria === 'string') {
                try {
                    values.criteria = JSON.parse(values.criteria);
                } catch (e) {
                    console.warn('Failed to parse criteria JSON:', values.criteria);
                    values.criteria = {};
                }
            }

            return values;
        }
    }

    Achievement.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        icon: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: 'Icon name or emoji'
        },
        rarity: {
            type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
            defaultValue: 'common'
        },
        xpReward: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        criteria: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Achievement criteria as JSON'
        }
    }, {
        sequelize,
        modelName: 'Achievement',
        tableName: 'Achievements',
        timestamps: true
    })

    return Achievement
}



