'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HealthDataPoint extends Model {
    static associate(models) {
      HealthDataPoint.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  HealthDataPoint.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      metric: {
        type: DataTypes.ENUM('hr', 'bp_systolic', 'bp_diastolic', 'glucose', 'sleep', 'steps', 'hrv', 'weight'),
        allowNull: false
      },
      value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      unit: { type: DataTypes.STRING(16), allowNull: true },
      source: { type: DataTypes.STRING(64), allowNull: true },
      capturedAt: { type: DataTypes.DATE, allowNull: false }
    },
    {
      sequelize,
      modelName: 'HealthDataPoint',
      tableName: 'health_data_points',
      underscored: false,
      indexes: [{ fields: ['userId', 'capturedAt'] }, { fields: ['metric'] }]
    }
  );

  return HealthDataPoint;
};


