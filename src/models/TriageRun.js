'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TriageRun extends Model {
    static associate(models) {
      TriageRun.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      TriageRun.belongsTo(models.IntakeResponse, { foreignKey: 'intakeResponseId', as: 'intakeResponse' });
      TriageRun.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      TriageRun.hasMany(models.MedicalQuestion, { foreignKey: 'triageRunId', as: 'questions' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      const jsonFields = ['inputs', 'ruleHits', 'messages'];
      jsonFields.forEach((field) => {
        if (values[field] && typeof values[field] === 'string') {
          try {
            values[field] = JSON.parse(values[field]);
          } catch (e) {
            values[field] = field === 'ruleHits' || field === 'messages' ? [] : {};
          }
        }
      });
      return values;
    }
  }

  TriageRun.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      intakeResponseId: { type: DataTypes.INTEGER, allowNull: true },
      inputs: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      ruleHits: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      riskLevel: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), allowNull: false },
      disposition: { type: DataTypes.ENUM('ok', 'book_consult', 'urgent_care'), allowNull: false },
      messages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      createdByType: { type: DataTypes.ENUM('ai', 'medical'), allowNull: false, defaultValue: 'ai' },
      createdBy: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      sequelize,
      modelName: 'TriageRun',
      tableName: 'triage_runs',
      underscored: false,
      indexes: [{ fields: ['userId'] }, { fields: ['disposition'] }, { fields: ['riskLevel'] }]
    }
  );

  return TriageRun;
};


