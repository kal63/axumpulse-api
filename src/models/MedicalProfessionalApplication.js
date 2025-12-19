'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedicalProfessionalApplication extends Model {
    static associate(models) {
      MedicalProfessionalApplication.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      MedicalProfessionalApplication.hasMany(models.MedicalCredentialFile, {
        foreignKey: 'applicationId',
        as: 'credentialFiles'
      });
      MedicalProfessionalApplication.hasOne(models.MedicalProfessional, {
        foreignKey: 'applicationId',
        as: 'medicalProfessional'
      });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      const jsonFields = ['specialties', 'languages', 'licenseInfo', 'portfolio', 'socialMedia', 'preferences'];
      jsonFields.forEach((field) => {
        if (values[field] && typeof values[field] === 'string') {
          try {
            values[field] = JSON.parse(values[field]);
          } catch (e) {
            values[field] = field === 'socialMedia' || field === 'licenseInfo' || field === 'preferences' ? {} : [];
          }
        }
      });
      return values;
    }
  }

  MedicalProfessionalApplication.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' }
      },
      professionalType: {
        type: DataTypes.ENUM('doctor', 'nurse', 'health_coach', 'nutritionist'),
        allowNull: false
      },
      specialties: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      yearsOfExperience: { type: DataTypes.INTEGER, allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      languages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      licenseInfo: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      portfolio: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      socialMedia: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      preferences: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      status: {
        type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
      },
      rejectionReason: { type: DataTypes.TEXT, allowNull: true },
      adminNotes: { type: DataTypes.TEXT, allowNull: true },
      submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      reviewedAt: { type: DataTypes.DATE, allowNull: true },
      reviewedBy: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      sequelize,
      modelName: 'MedicalProfessionalApplication',
      tableName: 'medical_professional_applications',
      underscored: false,
      indexes: [{ unique: true, fields: ['userId'] }, { fields: ['status'] }, { fields: ['submittedAt'] }]
    }
  );

  return MedicalProfessionalApplication;
};


