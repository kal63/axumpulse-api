'use strict'

module.exports = (sequelize, DataTypes) => {
    const PaymentTransaction = sequelize.define('PaymentTransaction', {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        subscriptionPlanId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'subscription_plans',
                key: 'id'
            }
        },
        trainerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        txRef: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
        },
        chapaRefId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            sparse: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'ETB'
        },
        status: {
            type: DataTypes.ENUM('pending', 'success', 'failed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
        },
        paymentMethod: {
            type: DataTypes.ENUM('card', 'telebirr', 'cbebirr', 'awashbirr', 'bank', 'mpesa', 'other'),
            allowNull: true
        },
        customerEmail: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        customerName: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        customerPhone: {
            type: DataTypes.STRING(32),
            allowNull: true
        },
        callbackData: {
            type: DataTypes.JSON,
            allowNull: true
        },
        verificationData: {
            type: DataTypes.JSON,
            allowNull: true
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'payment_transactions',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['txRef'],
                name: 'payment_transactions_tx_ref_unique'
            },
            {
                unique: true,
                fields: ['chapaRefId'],
                name: 'payment_transactions_chapa_ref_id_unique',
                where: {
                    chapaRefId: {
                        [sequelize.Sequelize.Op.ne]: null
                    }
                }
            },
            {
                fields: ['userId'],
                name: 'payment_transactions_user_id_idx'
            },
            {
                fields: ['status'],
                name: 'payment_transactions_status_idx'
            },
            {
                fields: ['userId', 'status'],
                name: 'payment_transactions_user_status_idx'
            },
            {
                fields: ['status', 'createdAt'],
                name: 'payment_transactions_status_created_idx'
            }
        ]
    })

    PaymentTransaction.associate = (models) => {
        PaymentTransaction.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        })
        PaymentTransaction.belongsTo(models.SubscriptionPlan, {
            foreignKey: 'subscriptionPlanId',
            as: 'subscriptionPlan'
        })
        PaymentTransaction.belongsTo(models.User, {
            foreignKey: 'trainerId',
            as: 'trainer'
        })
    }

    // Override toJSON to parse JSON fields
    PaymentTransaction.prototype.toJSON = function () {
        const values = Object.assign({}, this.get())

        const jsonFields = ['callbackData', 'verificationData']

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field])
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field])
                    values[field] = null
                }
            }
        })

        return values
    }

    return PaymentTransaction
}

