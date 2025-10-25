'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TrainerApplication extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // User relationship - get user data from User model
            TrainerApplication.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });

            // Certification files
            TrainerApplication.hasMany(models.CertificationFile, {
                foreignKey: 'applicationId',
                as: 'certificationFiles'
            });

            // Trainers (for approved applications)
            TrainerApplication.hasMany(models.Trainer, {
                foreignKey: 'applicationId',
                as: 'trainers'
            });
        }

        // Override toJSON to parse JSON fields that might be returned as strings
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            const jsonFields = ['specialties', 'languages', 'certifications', 'portfolio', 'socialMedia', 'preferences'];

            jsonFields.forEach(field => {
                if (values[field] && typeof values[field] === 'string') {
                    try {
                        values[field] = JSON.parse(values[field]);
                    } catch (e) {
                        console.warn(`Failed to parse ${field} JSON:`, values[field]);
                        values[field] = [];
                    }
                }
            });

            return values;
        }
    }

    TrainerApplication.init({
        // User reference (NEW - replaces phone, fullName, email, dateOfBirth)
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            validate: {
                notNull: true,
                isInt: true
            }
        },

        // REMOVED: phone, fullName, email, dateOfBirth, profilePicture
        // These are now accessed via: application.user.name, application.user.phone, etc.

        // Trainer-specific fields (KEEP ALL)
        specialties: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Specialties must be an array');
                    }
                }
            }
        },
        yearsOfExperience: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 0,
                max: 50
            }
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 2000]
            }
        },
        languages: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Languages must be an array');
                    }
                }
            }
        },
        certifications: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Certifications must be an array');
                    }
                }
            }
        },
        portfolio: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Portfolio must be an array');
                    }
                }
            }
        },
        socialMedia: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        status: {
            type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
            validate: {
                isIn: [['pending', 'under_review', 'approved', 'rejected']]
            }
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        submittedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isInt: true
            }
        }
    }, {
        sequelize,
        modelName: 'TrainerApplication',
        tableName: 'TrainerApplications',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['userId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['submittedAt']
            }
        ]
    });

    return TrainerApplication;
};
