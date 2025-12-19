'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsultSlot extends Model {
    static associate(models) {
      ConsultSlot.belongsTo(models.User, { foreignKey: 'providerId', as: 'provider' });
      ConsultSlot.hasOne(models.ConsultBooking, { foreignKey: 'slotId', as: 'booking' });
    }
  }

  ConsultSlot.init(
    {
      providerId: { type: DataTypes.INTEGER, allowNull: false },
      startAt: { type: DataTypes.DATE, allowNull: false },
      endAt: { type: DataTypes.DATE, allowNull: false },
      type: { type: DataTypes.ENUM('quick', 'full', 'follow_up'), allowNull: false },
      timezone: { type: DataTypes.STRING(64), allowNull: true },
      status: { type: DataTypes.ENUM('open', 'closed'), allowNull: false, defaultValue: 'open' }
    },
    {
      sequelize,
      modelName: 'ConsultSlot',
      tableName: 'consult_slots',
      underscored: false,
      indexes: [{ fields: ['providerId'] }, { fields: ['startAt'] }, { fields: ['status'] }]
    }
  );

  return ConsultSlot;
};


