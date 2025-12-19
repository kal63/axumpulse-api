'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsultNote extends Model {
    static associate(models) {
      ConsultNote.belongsTo(models.ConsultBooking, { foreignKey: 'bookingId', as: 'booking' });
      ConsultNote.belongsTo(models.User, { foreignKey: 'providerId', as: 'provider' });
      ConsultNote.hasMany(models.MedicalAttachment, {
        foreignKey: 'entityId',
        constraints: false,
        scope: { entityType: 'consult_note' },
        as: 'attachments'
      });
    }

    toJSON() {
      const values = Object.assign({}, this.get());
      const jsonFields = ['soap', 'diagnoses', 'recommendations', 'followUps', 'constraints'];
      jsonFields.forEach((field) => {
        if (values[field] && typeof values[field] === 'string') {
          try {
            values[field] = JSON.parse(values[field]);
          } catch (e) {
            if (field === 'soap' || field === 'constraints') values[field] = {};
            else values[field] = [];
          }
        }
      });
      return values;
    }
  }

  ConsultNote.init(
    {
      bookingId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      providerId: { type: DataTypes.INTEGER, allowNull: false },
      soap: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      diagnoses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      recommendations: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      followUps: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      constraints: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
      summaryShared: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      summaryVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
    },
    {
      sequelize,
      modelName: 'ConsultNote',
      tableName: 'consult_notes',
      underscored: false,
      indexes: [{ unique: true, fields: ['bookingId'] }, { fields: ['providerId'] }]
    }
  );

  return ConsultNote;
};


