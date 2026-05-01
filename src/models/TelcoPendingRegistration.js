'use strict'

module.exports = (sequelize, DataTypes) => {
  const TelcoPendingRegistration = sequelize.define(
    'TelcoPendingRegistration',
    {
      phone: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      productCode: {
        type: DataTypes.STRING(128),
        allowNull: false
      },
      subscriptionPlanId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      trainerId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      duration: {
        type: DataTypes.ENUM('daily', 'monthly', 'threeMonth', 'sixMonth', 'nineMonth', 'yearly'),
        allowNull: false
      },
      rawPayload: {
        type: DataTypes.JSON,
        allowNull: true
      },
      consumedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      },
      consumedUserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: 'telco_pending_registrations',
      underscored: false
    }
  )

  TelcoPendingRegistration.associate = (models) => {
    TelcoPendingRegistration.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'subscriptionPlanId',
      as: 'subscriptionPlan'
    })
    TelcoPendingRegistration.belongsTo(models.User, {
      foreignKey: 'trainerId',
      as: 'trainer'
    })
    TelcoPendingRegistration.belongsTo(models.User, {
      foreignKey: 'consumedUserId',
      as: 'consumedByUser'
    })
  }

  return TelcoPendingRegistration
}
