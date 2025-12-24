'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class WorkoutPlanInsight extends Model {
        static associate(models) {
            // A workout plan insight belongs to a user
            WorkoutPlanInsight.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });

            // A workout plan insight belongs to a workout plan
            WorkoutPlanInsight.belongsTo(models.WorkoutPlan, {
                foreignKey: 'workoutPlanId',
                as: 'workoutPlan'
            });

            // A workout plan insight is created by a medical professional (User)
            WorkoutPlanInsight.belongsTo(models.User, {
                foreignKey: 'createdBy',
                as: 'creator'
            });
        }

        // Override toJSON to parse JSON fields
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            if (values.customLabels && typeof values.customLabels === 'string') {
                try {
                    values.customLabels = JSON.parse(values.customLabels);
                } catch (e) {
                    console.warn('Failed to parse customLabels JSON:', values.customLabels);
                    values.customLabels = [];
                }
            }

            if (values.medicalContext && typeof values.medicalContext === 'string') {
                try {
                    values.medicalContext = JSON.parse(values.medicalContext);
                } catch (e) {
                    console.warn('Failed to parse medicalContext JSON:', values.medicalContext);
                    values.medicalContext = {};
                }
            }

            return values;
        }
    }

    WorkoutPlanInsight.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        workoutPlanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'WorkoutPlans',
                key: 'id'
            }
        },
        insightText: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: true
            }
        },
        customLabels: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        suitability: {
            type: DataTypes.ENUM('recommended', 'caution', 'not_recommended', 'requires_modification'),
            allowNull: false,
            defaultValue: 'recommended'
        },
        medicalContext: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        sourceType: {
            type: DataTypes.ENUM('ai', 'medical_professional', 'ai_edited'),
            allowNull: false,
            defaultValue: 'medical_professional'
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        generatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'WorkoutPlanInsight',
        tableName: 'WorkoutPlanInsights',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'workoutPlanId'],
                name: 'unique_user_workout_plan_insight'
            },
            {
                fields: ['userId']
            },
            {
                fields: ['workoutPlanId']
            },
            {
                fields: ['createdBy']
            },
            {
                fields: ['suitability']
            }
        ]
    });

    return WorkoutPlanInsight;
};

