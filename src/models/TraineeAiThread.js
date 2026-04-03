'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class TraineeAiThread extends Model {
    static associate(models) {
      TraineeAiThread.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
      TraineeAiThread.belongsTo(models.User, { foreignKey: 'trainerUserId', as: 'trainer' })
      TraineeAiThread.hasMany(models.TraineeAiMessage, { foreignKey: 'threadId', as: 'messages' })
    }
  }

  TraineeAiThread.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false },
      trainerUserId: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING(255), allowNull: true }
    },
    {
      sequelize,
      modelName: 'TraineeAiThread',
      tableName: 'trainee_ai_threads',
      underscored: false
    }
  )

  return TraineeAiThread
}
