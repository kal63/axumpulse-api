'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CertificationFile extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // Define associations here
            CertificationFile.belongsTo(models.TrainerApplication, {
                foreignKey: 'applicationId',
                as: 'application'
            });
        }
    }

    CertificationFile.init({
        applicationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'TrainerApplications',
                key: 'id'
            }
        },
        fileName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255]
            }
        },
        fileUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            validate: {
                notEmpty: true,
                isUrl: true
            }
        },
        fileType: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
                isIn: [['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']]
            }
        },
        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 10 * 1024 * 1024 // 10MB max
            }
        }
    }, {
        sequelize,
        modelName: 'CertificationFile',
        tableName: 'CertificationFiles',
        underscored: false,
        indexes: [
            {
                fields: ['applicationId']
            }
        ]
    });

    return CertificationFile;
};
