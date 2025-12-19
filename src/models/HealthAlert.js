'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HealthAlert extends Model {
    static associate(models) {
      HealthAlert.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      HealthAlert.belongsTo(models.User, { foreignKey: 'assignedTo', as: 'assignee' });
    }
  }

  HealthAlert.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      triggerSource: { type: DataTypes.ENUM('threshold', 'triage', 'manual'), allowNull: false },
      severity: { type: DataTypes.ENUM('info', 'warn', 'high'), allowNull: false, defaultValue: 'info' },
      message: { type: DataTypes.TEXT, allowNull: false },
      status: { type: DataTypes.ENUM('open', 'ack', 'closed'), allowNull: false, defaultValue: 'open' },
      assignedTo: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      sequelize,
      modelName: 'HealthAlert',
      tableName: 'health_alerts',
      underscored: false,
      indexes: [{ fields: ['userId'] }, { fields: ['status'] }, { fields: ['assignedTo'] }]
    }
  );

  return HealthAlert;
};


