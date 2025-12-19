'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalAttachment extends Model {
    static associate(models) {
      MedicalAttachment.belongsTo(models.User, { foreignKey: 'ownerId', as: 'owner' });
      // Note: entityType/entityId is polymorphic; associations are defined from the owning models.
    }
  }

  MedicalAttachment.init(
    {
      ownerId: { type: DataTypes.INTEGER, allowNull: false },
      entityType: {
        type: DataTypes.ENUM('question', 'answer', 'consult_note', 'medical_application'),
        allowNull: false
      },
      entityId: { type: DataTypes.INTEGER, allowNull: false },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      fileUrl: { type: DataTypes.STRING(500), allowNull: false },
      fileType: { type: DataTypes.STRING(80), allowNull: false },
      fileSize: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      modelName: 'MedicalAttachment',
      tableName: 'medical_attachments',
      underscored: false,
      indexes: [{ fields: ['ownerId'] }, { fields: ['entityType', 'entityId'] }]
    }
  );

  return MedicalAttachment;
};


