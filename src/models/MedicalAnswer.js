'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalAnswer extends Model {
    static associate(models) {
      MedicalAnswer.belongsTo(models.MedicalQuestion, { foreignKey: 'questionId', as: 'question' });
      MedicalAnswer.belongsTo(models.User, { foreignKey: 'responderId', as: 'responder' });
      MedicalAnswer.hasMany(models.MedicalAttachment, {
        foreignKey: 'entityId',
        constraints: false,
        scope: { entityType: 'answer' },
        as: 'attachments'
      });
    }
  }

  MedicalAnswer.init(
    {
      questionId: { type: DataTypes.INTEGER, allowNull: false },
      responderId: { type: DataTypes.INTEGER, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      visibility: { type: DataTypes.ENUM('user', 'user_trainer', 'internal'), allowNull: false, defaultValue: 'user' }
    },
    {
      sequelize,
      modelName: 'MedicalAnswer',
      tableName: 'medical_answers',
      underscored: false,
      indexes: [{ fields: ['questionId'] }, { fields: ['responderId'] }]
    }
  );

  return MedicalAnswer;
};


