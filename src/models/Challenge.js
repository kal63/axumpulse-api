'use strict'

module.exports = (sequelize, DataTypes) => {
    const Challenge = sequelize.define('Challenge', {
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        kind: { type: DataTypes.STRING(32), allowNull: false },
        ruleJson: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        startTime: { type: DataTypes.DATE, allowNull: false },
        endTime: { type: DataTypes.DATE, allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        createdBy: { type: DataTypes.INTEGER, allowNull: true },
        // Additional fields for trainer challenges
        type: {
            type: DataTypes.ENUM('fitness', 'nutrition', 'wellness', 'achievement'),
            allowNull: true,
            defaultValue: 'fitness'
        },
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: true,
            defaultValue: 'beginner'
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 7,
            validate: {
                min: 1,
                max: 365
            }
        },
        xpReward: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 100,
            validate: {
                min: 0
            }
        },
        requirements: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        contentIds: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        language: {
            type: DataTypes.STRING(5),
            allowNull: true,
            defaultValue: 'en'
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'active'),
            allowNull: true,
            defaultValue: 'draft'
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        participantCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        completionCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true
        },
        isTrainerCreated: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        trainerId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'trainers',
                key: 'userId'
            }
        }
    }, {
        tableName: 'Challenges',
        underscored: false,
        indexes: [
            {
                fields: ['trainerId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['type']
            },
            {
                fields: ['difficulty']
            },
            {
                fields: ['isPublic']
            },
            {
                fields: ['isTrainerCreated']
            }
        ]
    })

    Challenge.associate = (models) => {
        // Associate with Trainer if it's a trainer-created challenge
        Challenge.belongsTo(models.Trainer, {
            foreignKey: 'trainerId',
            as: 'trainer'
        })
        Challenge.hasMany(models.UserChallengeProgress, {
            foreignKey: 'challengeId',
            as: 'userProgress'
        })
    }

    // Override toJSON to parse JSON fields that might be returned as strings
    Challenge.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        const jsonFields = ['ruleJson', 'contentIds'];

        jsonFields.forEach(field => {
            if (values[field] && typeof values[field] === 'string') {
                try {
                    values[field] = JSON.parse(values[field]);
                } catch (e) {
                    console.warn(`Failed to parse ${field} JSON:`, values[field]);
                    values[field] = field === 'contentIds' ? [] : {};
                }
            }
        });

        return values;
    }

    return Challenge
}





