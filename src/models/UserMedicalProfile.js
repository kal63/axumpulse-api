'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserMedicalProfile extends Model {
    static associate(models) {
      UserMedicalProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      UserMedicalProfile.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      const jsonFields = ['conditions', 'medications', 'allergies', 'surgeries', 'contraindications'];
      jsonFields.forEach((field) => {
        if (values[field] && typeof values[field] === 'string') {
          try {
            values[field] = JSON.parse(values[field]);
          } catch (e) {
            values[field] = [];
          }
        }
      });
      return values;
    }
  }

  UserMedicalProfile.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      conditions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      medications: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      allergies: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      surgeries: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      pregnancyStatus: { type: DataTypes.STRING(32), allowNull: true },
      contraindications: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      notes: { type: DataTypes.TEXT, allowNull: true },
      updatedBy: { type: DataTypes.INTEGER, allowNull: true }
    },
    {
      sequelize,
      modelName: 'UserMedicalProfile',
      tableName: 'user_medical_profiles',
      underscored: false,
      indexes: [{ unique: true, fields: ['userId'] }]
    }
  );

  return UserMedicalProfile;
};


