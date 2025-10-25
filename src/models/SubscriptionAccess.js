'use strict'

module.exports = (sequelize, DataTypes) => {
    const SubscriptionAccess = sequelize.define('SubscriptionAccess', {
        userId: { type: DataTypes.INTEGER, allowNull: false },
        subscriptionStatus: { type: DataTypes.STRING(16), allowNull: false },
        externalSubId: { type: DataTypes.STRING(64), allowNull: true },
        currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
        providerName: { type: DataTypes.STRING(64), allowNull: false },
        metaJson: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        lastCheckedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('CURRENT_TIMESTAMP') },
    }, {
        tableName: 'SubscriptionAccesses',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['userId'],
                name: 'subscription_accesses_user_id_unique'
            }
        ]
    })
    SubscriptionAccess.associate = (models) => {
        SubscriptionAccess.belongsTo(models.User, { foreignKey: 'userId' })
    }

    // Override toJSON to parse JSON fields that might be returned as strings
    SubscriptionAccess.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        if (values.metaJson && typeof values.metaJson === 'string') {
            try {
                values.metaJson = JSON.parse(values.metaJson);
            } catch (e) {
                console.warn('Failed to parse metaJson JSON:', values.metaJson);
                values.metaJson = {};
            }
        }

        return values;
    }

    return SubscriptionAccess
}



