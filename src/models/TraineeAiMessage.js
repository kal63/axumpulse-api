'use strict'

const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
  class TraineeAiMessage extends Model {
    static associate(models) {
      TraineeAiMessage.belongsTo(models.TraineeAiThread, { foreignKey: 'threadId', as: 'thread' })
    }
  }

  TraineeAiMessage.init(
    {
      threadId: { type: DataTypes.INTEGER, allowNull: false },
      role: {
        type: DataTypes.ENUM('user', 'assistant', 'system'),
        allowNull: false
      },
      content: { type: DataTypes.TEXT('long'), allowNull: false }
    },
    {
      sequelize,
      modelName: 'TraineeAiMessage',
      tableName: 'trainee_ai_messages',
      underscored: false
    }
  )

  return TraineeAiMessage
}
