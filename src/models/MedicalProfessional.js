'use strict';

module.exports = (sequelize, DataTypes) => {
  const MedicalProfessional = sequelize.define(
    'MedicalProfessional',
    {
      userId: { type: DataTypes.INTEGER, primaryKey: true },
      professionalType: {
        type: DataTypes.ENUM('doctor', 'nurse', 'health_coach', 'nutritionist'),
        allowNull: false
      },
      bio: { type: DataTypes.TEXT, allowNull: true },
      specialties: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      applicationId: { type: DataTypes.INTEGER, allowNull: true },
      verifiedAt: { type: DataTypes.DATE, allowNull: true },
      verifiedBy: { type: DataTypes.INTEGER, allowNull: true },
      consultFee: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: null }
    },
    {
      tableName: 'medical_professionals',
      underscored: false,
      indexes: [{ fields: ['verified'] }, { fields: ['applicationId'] }]
    }
  );

  MedicalProfessional.associate = (models) => {
    MedicalProfessional.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    MedicalProfessional.belongsTo(models.MedicalProfessionalApplication, {
      foreignKey: 'applicationId',
      as: 'application'
    });
    MedicalProfessional.belongsTo(models.User, { foreignKey: 'verifiedBy', as: 'verifier' });
  };

  MedicalProfessional.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    if (values.specialties && typeof values.specialties === 'string') {
      try {
        values.specialties = JSON.parse(values.specialties);
      } catch (e) {
        values.specialties = [];
      }
    }
    return values;
  };

  return MedicalProfessional;
};


