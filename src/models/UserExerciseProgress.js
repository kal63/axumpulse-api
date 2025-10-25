'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class UserExerciseProgress extends Model {
        static associate(models) {
            // Belongs to User
            UserExerciseProgress.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            })

            // Belongs to WorkoutPlan
            UserExerciseProgress.belongsTo(models.WorkoutPlan, {
                foreignKey: 'workoutPlanId',
                as: 'workoutPlan'
            })

            // Belongs to WorkoutExercise
            UserExerciseProgress.belongsTo(models.WorkoutExercise, {
                foreignKey: 'exerciseId',
                as: 'exercise'
            })
        }
    }

    UserExerciseProgress.init({
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
        exerciseId: {
            type: DataTypes.INTEGER,
            allowNull: false
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
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'UserExerciseProgress',
        tableName: 'UserExerciseProgress',
        timestamps: true
    })

    return UserExerciseProgress
}




