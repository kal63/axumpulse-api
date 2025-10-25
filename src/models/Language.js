'use strict'

module.exports = (sequelize, DataTypes) => {
    const Language = sequelize.define('Language', {
        code: { type: DataTypes.STRING(5), allowNull: false },
        name: { type: DataTypes.STRING, allowNull: false },
        nativeName: { type: DataTypes.STRING, allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        tableName: 'Languages',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['code'],
                name: 'languages_code_unique'
            }
        ]
    })
    Language.associate = (_models) => { }
    return Language
}



