'use strict'

module.exports = (sequelize, DataTypes) => {
    const UserProfile = sequelize.define('UserProfile', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },

        // Activity & Progress
        totalXp: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        challengesCompleted: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        workoutsCompleted: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },

        // Subscription
        subscriptionTier: {
            type: DataTypes.ENUM('premium', 'pro'),
            allowNull: false,
            defaultValue: 'premium'
        },

        // Preferences
        language: {
            type: DataTypes.STRING(5),
            allowNull: true,
            defaultValue: 'en'
        },
        notificationSettings: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },

        // Additional user-specific data
        fitnessGoals: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        healthMetrics: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        }
    }, {
        tableName: 'user_profiles',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['userId'],
                name: 'user_profiles_user_id_unique'
            }
        ]
    })

    UserProfile.associate = (models) => {
        UserProfile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        })
    }

    // Override toJSON to parse JSON fields that might be returned as strings
    UserProfile.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        const jsonFields = ['notificationSettings', 'fitnessGoals', 'healthMetrics', 'preferences'];

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field]);
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field]);
                    values[field] = {};
                }
            }
        });

        return values;
    }

    return UserProfile
}
