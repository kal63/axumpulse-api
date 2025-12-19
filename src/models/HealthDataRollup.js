'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HealthDataRollup extends Model {
    static associate(models) {
      HealthDataRollup.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      if (values.agg && typeof values.agg === 'string') {
        try {
          values.agg = JSON.parse(values.agg);
        } catch (e) {
          values.agg = {};
        }
      }
      return values;
    }
  }

  HealthDataRollup.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      metric: { type: DataTypes.STRING(32), allowNull: false },
      periodDate: { type: DataTypes.DATEONLY, allowNull: false },
      agg: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }
    },
    {
      sequelize,
      modelName: 'HealthDataRollup',
      tableName: 'health_data_rollups',
      underscored: false,
      indexes: [{ unique: true, fields: ['userId', 'metric', 'periodDate'] }]
    }
  );

  return HealthDataRollup;
};


