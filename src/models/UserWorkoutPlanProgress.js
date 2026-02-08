'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class UserWorkoutPlanProgress extends Model {
        static associate(models) {
            // Belongs to User
            UserWorkoutPlanProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            })

            // Belongs to WorkoutPlan
            UserWorkoutPlanProgress.belongsTo(models.WorkoutPlan, {
                foreignKey: 'workoutPlanId',
                as: 'workoutPlan'
            })

            // Belongs to Game (if won from a game)
            UserWorkoutPlanProgress.belongsTo(models.Game, {
                foreignKey: 'fromGameId',
                as: 'fromGame'
            })
        }
    }

    UserWorkoutPlanProgress.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        workoutPlanId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'completed', 'paused'),
            defaultValue: 'active'
        },
        startedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        lastAccessedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        completedExercises: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        totalExercises: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        xpEarned: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        fromGameId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'ID of the game this workout plan was won from (for bonus XP)'
        }
    }, {
        sequelize,
        modelName: 'UserWorkoutPlanProgress',
        tableName: 'UserWorkoutPlanProgress',
        timestamps: true
    })

    return UserWorkoutPlanProgress
}




