'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ConsultBooking extends Model {
    static associate(models) {
      ConsultBooking.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      ConsultBooking.belongsTo(models.ConsultSlot, { foreignKey: 'slotId', as: 'slot' });
      ConsultBooking.hasOne(models.ConsultNote, { foreignKey: 'bookingId', as: 'note' });
    }
  }

  ConsultBooking.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      slotId: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('booked', 'canceled', 'completed', 'no_show'),
        allowNull: false,
        defaultValue: 'booked'
      },
      canceledAt: { type: DataTypes.DATE, allowNull: true },
      cancelReason: { type: DataTypes.TEXT, allowNull: true }
    },
    {
      sequelize,
      modelName: 'ConsultBooking',
      tableName: 'consult_bookings',
      underscored: false,
      indexes: [
        { fields: ['userId'] },
        { unique: true, fields: ['slotId'] },
        { fields: ['status'] }
      ]
    }
  );

  return ConsultBooking;
};


