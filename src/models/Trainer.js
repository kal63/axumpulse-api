'use strict'

module.exports = (sequelize, DataTypes) => {
    const Trainer = sequelize.define('Trainer', {
        userId: { type: DataTypes.INTEGER, primaryKey: true },
        bio: { type: DataTypes.TEXT, allowNull: true },
        specialties: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        applicationId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'TrainerApplications',
                key: 'id'
            }
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        verifiedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        }
    }, {
        tableName: 'Trainers',
        underscored: false,
        indexes: [
            {
                fields: ['applicationId']
            },
            {
                fields: ['verifiedAt']
            }
        ]
    })

    Trainer.associate = (models) => {
        Trainer.belongsTo(models.User, { foreignKey: 'userId' })
        Trainer.belongsTo(models.TrainerApplication, {
            foreignKey: 'applicationId',
            as: 'application'
        })
        Trainer.belongsTo(models.User, {
            foreignKey: 'verifiedBy',
            as: 'verifier'
        })
    }

    // Override toJSON to parse JSON fields that might be returned as strings
    Trainer.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        if (values.specialties && typeof values.specialties === 'string') {
            try {
                values.specialties = JSON.parse(values.specialties);
            } catch (e) {
                console.warn('Failed to parse specialties JSON:', values.specialties);
                values.specialties = [];
            }
        }

        return values;
    }

    return Trainer
}



