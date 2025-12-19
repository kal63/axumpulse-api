'use strict'

const { isValidEthiopianPhone, normalizeEthiopianPhone } = require('../utils/phone');

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        // Authentication & Contact
        phone: {
            type: DataTypes.STRING(32),
            allowNull: false,
            validate: {
                isEthiopianPhone(value) {
                    if (!isValidEthiopianPhone(value)) {
                        throw new Error('Phone number must be a valid Ethiopian phone number (+251XXXXXXXXX)');
                    }
                }
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: true
            }
        },
        passwordHash: { type: DataTypes.STRING(255), allowNull: true },

        // Personal Information
        name: { type: DataTypes.STRING(100), allowNull: true },
        profilePicture: { type: DataTypes.TEXT, allowNull: true },
        dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
        gender: {
            type: DataTypes.ENUM('male', 'female'),
            allowNull: true
        },

        // Account Status & Roles
        isTrainer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        isMedical: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        status: { type: DataTypes.STRING(16), allowNull: false, defaultValue: 'active' },

        // Activity Tracking
        lastLoginAt: { type: DataTypes.DATE, allowNull: true },
        lastActiveAt: { type: DataTypes.DATE, allowNull: true },
    }, {
        tableName: 'users',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['phone'],
                name: 'users_phone_unique'
            },
            {
                unique: true,
                fields: ['email'],
                name: 'users_email_unique'
            }
        ],
        hooks: {
            beforeCreate: (user) => {
                if (user.phone) {
                    user.phone = normalizeEthiopianPhone(user.phone);
                }
            },
            beforeUpdate: (user) => {
                if (user.phone) {
                    user.phone = normalizeEthiopianPhone(user.phone);
                }
            }
        }
    })

    User.associate = (models) => {
        User.hasOne(models.SubscriptionAccess, { foreignKey: 'userId' })
        User.hasOne(models.Trainer, { foreignKey: 'userId' })
        User.hasOne(models.MedicalProfessional, { foreignKey: 'userId', as: 'medicalProfessional' })
        User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' })
        User.hasOne(models.UserMedicalProfile, { foreignKey: 'userId', as: 'medicalProfile' })
        User.hasMany(models.UserContentProgress, { foreignKey: 'userId', as: 'contentProgress' })
        User.hasMany(models.UserWorkoutPlanProgress, { foreignKey: 'userId', as: 'workoutProgress' })
        User.hasMany(models.UserExerciseProgress, { foreignKey: 'userId', as: 'exerciseProgress' })
        User.hasMany(models.UserChallengeProgress, { foreignKey: 'userId', as: 'challengeProgress' })
        User.hasMany(models.UserAchievement, { foreignKey: 'userId', as: 'achievements' })

        // Medical layer
        User.hasMany(models.IntakeResponse, { foreignKey: 'userId', as: 'intakeResponses' })
        User.hasMany(models.TriageRun, { foreignKey: 'userId', as: 'triageRuns' })
        User.hasMany(models.MedicalQuestion, { foreignKey: 'userId', as: 'medicalQuestions' })
        User.hasMany(models.ConsultSlot, { foreignKey: 'providerId', as: 'consultSlots' })
        User.hasMany(models.ConsultBooking, { foreignKey: 'userId', as: 'consultBookings' })
        User.hasMany(models.HealthDataPoint, { foreignKey: 'userId', as: 'healthDataPoints' })
        User.hasMany(models.HealthAlert, { foreignKey: 'userId', as: 'healthAlerts' })
    }

    return User
}



