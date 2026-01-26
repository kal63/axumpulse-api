'use strict'

module.exports = (sequelize, DataTypes) => {
    const UserSubscription = sequelize.define('UserSubscription', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        trainerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        subscriptionPlanId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'subscription_plans',
                key: 'id'
            }
        },
        duration: {
            type: DataTypes.ENUM('daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly'),
            allowNull: false
        },
        startedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'expired', 'cancelled'),
            allowNull: false,
            defaultValue: 'active'
        },
        lastPaymentReference: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'user_subscriptions',
        underscored: false,
        indexes: [
            {
                fields: ['userId'],
                name: 'user_subscriptions_user_id_idx'
            },
            {
                fields: ['trainerId'],
                name: 'user_subscriptions_trainer_id_idx'
            },
            {
                fields: ['status'],
                name: 'user_subscriptions_status_idx'
            },
            {
                fields: ['expiresAt'],
                name: 'user_subscriptions_expires_at_idx'
            },
            {
                fields: ['userId', 'status'],
                name: 'user_subscriptions_user_status_idx'
            },
            {
                fields: ['userId', 'trainerId', 'status'],
                name: 'user_subscriptions_user_trainer_status_idx'
            }
        ]
    })

    UserSubscription.associate = (models) => {
        UserSubscription.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        })
        UserSubscription.belongsTo(models.User, {
            foreignKey: 'trainerId',
            as: 'trainer'
        })
        UserSubscription.belongsTo(models.SubscriptionPlan, {
            foreignKey: 'subscriptionPlanId',
            as: 'subscriptionPlan'
        })
    }

    return UserSubscription
}

