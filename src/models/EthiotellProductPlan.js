'use strict'

module.exports = (sequelize, DataTypes) => {
  const EthiotellProductPlan = sequelize.define(
    'EthiotellProductPlan',
    {
      productCode: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true
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
      label: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: 'ethiotell_product_plans',
      underscored: false
    }
  )

  EthiotellProductPlan.associate = (models) => {
    EthiotellProductPlan.belongsTo(models.SubscriptionPlan, {
      foreignKey: 'subscriptionPlanId',
      as: 'subscriptionPlan'
    })
    EthiotellProductPlan.belongsTo(models.User, {
      foreignKey: 'trainerId',
      as: 'trainer'
    })
  }

  return EthiotellProductPlan
}
