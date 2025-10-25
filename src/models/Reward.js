'use strict'

module.exports = (sequelize, DataTypes) => {
    const Reward = sequelize.define('Reward', {
        title: { type: DataTypes.STRING, allowNull: false },
        costXp: { type: DataTypes.INTEGER, allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        stock: { type: DataTypes.INTEGER, allowNull: true },
    }, { tableName: 'Rewards', underscored: false })
    Reward.associate = (_models) => { }
    return Reward
}





