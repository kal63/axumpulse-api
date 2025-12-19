'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalQuestion extends Model {
    static associate(models) {
      MedicalQuestion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      MedicalQuestion.belongsTo(models.TriageRun, { foreignKey: 'triageRunId', as: 'triageRun' });
      MedicalQuestion.hasMany(models.MedicalAnswer, { foreignKey: 'questionId', as: 'answers' });
      MedicalQuestion.hasMany(models.MedicalAttachment, {
        foreignKey: 'entityId',
        constraints: false,
        scope: { entityType: 'question' },
        as: 'attachments'
      });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      if (values.tags && typeof values.tags === 'string') {
        try {
          values.tags = JSON.parse(values.tags);
        } catch (e) {
          values.tags = [];
        }
      }
      return values;
    }
  }

  MedicalQuestion.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      triageRunId: { type: DataTypes.INTEGER, allowNull: true },
      text: { type: DataTypes.TEXT, allowNull: false },
      tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      status: { type: DataTypes.ENUM('open', 'answered', 'closed'), allowNull: false, defaultValue: 'open' }
    },
    {
      sequelize,
      modelName: 'MedicalQuestion',
      tableName: 'medical_questions',
      underscored: false,
      indexes: [{ fields: ['userId'] }, { fields: ['status'] }]
    }
  );

  return MedicalQuestion;
};


