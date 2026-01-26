'use strict'

module.exports = (sequelize, DataTypes) => {
    const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        level: {
            type: DataTypes.ENUM('silver', 'gold', 'diamond', 'platinum'),
            allowNull: false
        },
        dailyPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        monthlyPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        threeMonthPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        sixMonthPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        nineMonthPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        yearlyPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        discounts: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                monthly: 5,
                threeMonth: 10,
                sixMonth: 12,
                nineMonth: 15,
                yearly: 20
            }
        },
        features: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        minDuration: {
            type: DataTypes.ENUM('daily', 'monthly', 'threeMonth'),
            allowNull: false,
            defaultValue: 'daily'
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'subscription_plans',
        underscored: false,
        indexes: [
            {
                fields: ['level'],
                name: 'subscription_plans_level_idx'
            },
            {
                fields: ['active'],
                name: 'subscription_plans_active_idx'
            }
        ]
    })

    SubscriptionPlan.associate = (models) => {
        SubscriptionPlan.hasMany(models.UserSubscription, {
            foreignKey: 'subscriptionPlanId',
            as: 'subscriptions'
        })
        SubscriptionPlan.hasMany(models.PaymentTransaction, {
            foreignKey: 'subscriptionPlanId',
            as: 'paymentTransactions'
        })
    }

    // Override toJSON to parse JSON fields
    SubscriptionPlan.prototype.toJSON = function () {
        const values = Object.assign({}, this.get())

        const jsonFields = ['discounts', 'features']

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field])
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field])
                    values[field] = field === 'discounts' ? {} : []
                }
            }
        })

        return values
    }

    return SubscriptionPlan
}

