'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IntakeForm extends Model {
    static associate(models) {
      IntakeForm.hasMany(models.IntakeResponse, { foreignKey: 'formId', as: 'responses' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      if (values.schema && typeof values.schema === 'string') {
        try {
          values.schema = JSON.parse(values.schema);
        } catch (e) {
          values.schema = {};
        }
      }
      return values;
    }
  }

  IntakeForm.init(
    {
      version: { type: DataTypes.STRING(16), allowNull: false },
      schema: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      status: { type: DataTypes.ENUM('draft', 'published'), allowNull: false, defaultValue: 'draft' },
      publishedAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      modelName: 'IntakeForm',
      tableName: 'intake_forms',
      underscored: false,
      indexes: [{ fields: ['status'] }]
    }
  );

  return IntakeForm;
};


