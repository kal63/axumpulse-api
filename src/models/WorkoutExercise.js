'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class WorkoutExercise extends Model {
        static associate(models) {
            // An exercise belongs to a workout plan
            WorkoutExercise.belongsTo(models.WorkoutPlan, {
                foreignKey: 'workoutPlanId',
                as: 'workoutPlan'
            });

            WorkoutExercise.belongsTo(models.Content, {
                foreignKey: 'contentId',
                as: 'exerciseContent'
            });
        }

        // Override toJSON to parse JSON fields that might be returned as strings
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            if (values.muscleGroups && typeof values.muscleGroups === 'string') {
                try {
                    values.muscleGroups = JSON.parse(values.muscleGroups);
                } catch (e) {
                    console.warn('Failed to parse muscleGroups JSON:', values.muscleGroups);
                    values.muscleGroups = [];
                }
            }

            return values;
        }
    }

    WorkoutExercise.init({
        workoutPlanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'WorkoutPlans',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255]
            }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true // e.g., 'strength', 'cardio', 'flexibility'
        },
        muscleGroups: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [] // e.g., ['chest', 'shoulders', 'triceps']
        },
        equipment: {
            type: DataTypes.STRING,
            allowNull: true // e.g., 'dumbbells', 'bodyweight', 'barbell'
        },
        sets: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            }
        },
        reps: {
            type: DataTypes.STRING, // Can be "10-12" or "30 seconds" or "to failure"
            allowNull: true
        },
        weight: {
            type: DataTypes.STRING, // Can be "bodyweight" or "10-15 lbs"
            allowNull: true
        },
        duration: {
            type: DataTypes.INTEGER, // in seconds
            allowNull: true
        },
        restTime: {
            type: DataTypes.INTEGER, // in seconds
            allowNull: true
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        contentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Contents',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'WorkoutExercise',
        tableName: 'WorkoutExercises',
        timestamps: true
    });

    return WorkoutExercise;
};



