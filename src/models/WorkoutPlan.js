'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class WorkoutPlan extends Model {
        static associate(models) {
            // A workout plan belongs to a trainer (User)
            WorkoutPlan.belongsTo(models.Trainer, {
                foreignKey: 'trainerId',
                as: 'trainer'
            });

            // A workout plan can have many exercises
            WorkoutPlan.hasMany(models.WorkoutExercise, {
                foreignKey: 'workoutPlanId',
                as: 'exercises',
                onDelete: 'CASCADE'
            });

            // A workout plan can have many user progress records
            WorkoutPlan.hasMany(models.UserWorkoutPlanProgress, {
                foreignKey: 'workoutPlanId',
                as: 'userProgress'
            });

            // A workout plan can have many insights
            WorkoutPlan.hasMany(models.WorkoutPlanInsight, {
                foreignKey: 'workoutPlanId',
                as: 'insights',
                onDelete: 'CASCADE'
            });
        }

        // Override toJSON to parse JSON fields that might be returned as strings
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            if (values.tags && typeof values.tags === 'string') {
                try {
                    values.tags = JSON.parse(values.tags);
                } catch (e) {
                    console.warn('Failed to parse tags JSON:', values.tags);
                    values.tags = [];
                }
            }

            return values;
        }
    }

    WorkoutPlan.init({
        trainerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        title: {
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
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: false,
            defaultValue: 'beginner'
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true
        },
        language: {
            type: DataTypes.STRING,
            allowNull: true
        },
        tags: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'draft'
        },
        estimatedDuration: {
            type: DataTypes.INTEGER, // in minutes
            allowNull: true,
            validate: {
                min: 1
            }
        },
        totalExercises: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejectedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        rejectedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'WorkoutPlan',
        tableName: 'WorkoutPlans',
        timestamps: true
    });

    return WorkoutPlan;
};
