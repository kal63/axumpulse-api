'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalCredentialFile extends Model {
    static associate(models) {
      MedicalCredentialFile.belongsTo(models.MedicalProfessionalApplication, {
        foreignKey: 'applicationId',
        as: 'application'
      });
    }
  }

  MedicalCredentialFile.init(
    {
      applicationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'medical_professional_applications', key: 'id' }
      },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      fileUrl: { type: DataTypes.STRING(500), allowNull: false },
      fileType: { type: DataTypes.STRING(80), allowNull: false },
      fileSize: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      modelName: 'MedicalCredentialFile',
      tableName: 'medical_credential_files',
      underscored: false,
      indexes: [{ fields: ['applicationId'] }]
    }
  );

  return MedicalCredentialFile;
};


