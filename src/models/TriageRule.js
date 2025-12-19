'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TriageRule extends Model {
    static associate(models) {
      TriageRule.belongsTo(models.User, { foreignKey: 'publishedBy', as: 'publisher' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      if (values.definition && typeof values.definition === 'string') {
        try {
          values.definition = JSON.parse(values.definition);
        } catch (e) {
          values.definition = {};
        }
      }
      return values;
    }
  }

  TriageRule.init(
    {
      name: { type: DataTypes.STRING(128), allowNull: false },
      version: { type: DataTypes.STRING(16), allowNull: false },
      severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
      status: { type: DataTypes.ENUM('draft', 'published', 'retired'), allowNull: false, defaultValue: 'draft' },
      definition: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      publishedBy: { type: DataTypes.INTEGER, allowNull: true },
      publishedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      modelName: 'TriageRule',
      tableName: 'triage_rules',
      underscored: false,
      indexes: [{ fields: ['status'] }, { fields: ['severity'] }]
    }
  );

  return TriageRule;
};


