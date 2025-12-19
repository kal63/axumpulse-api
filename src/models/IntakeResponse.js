'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IntakeResponse extends Model {
    static associate(models) {
      IntakeResponse.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      IntakeResponse.belongsTo(models.IntakeForm, { foreignKey: 'formId', as: 'form' });
      IntakeResponse.hasMany(models.TriageRun, { foreignKey: 'intakeResponseId', as: 'triageRuns' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      if (values.answers && typeof values.answers === 'string') {
        try {
          values.answers = JSON.parse(values.answers);
        } catch (e) {
          values.answers = {};
        }
      }
      return values;
    }
  }

  IntakeResponse.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      formId: { type: DataTypes.INTEGER, allowNull: false },
      answers: { type: DataTypes.JSON, allowNull: false, defaultValue: {} }
    },
    {
      sequelize,
      modelName: 'IntakeResponse',
      tableName: 'intake_responses',
      underscored: false,
      indexes: [{ fields: ['userId'] }, { fields: ['formId'] }]
    }
  );

  return IntakeResponse;
};


