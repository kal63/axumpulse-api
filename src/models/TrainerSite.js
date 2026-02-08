'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TrainerSite extends Model {
        /**
         * Helper method for defining associations.
         */
        static associate(models) {
            TrainerSite.belongsTo(models.User, {
                foreignKey: 'userId',
                as: 'user'
            });
        }

        // Override toJSON to parse JSON fields that might be returned as strings
        toJSON() {
            const values = Object.assign({}, this.get());

            // Parse JSON fields that might be strings in production
            const jsonFields = ['galleryImages', 'theme', 'sections', 'trainerContent', 'socialLinks'];

            jsonFields.forEach(field => {
                if (values[field] && typeof values[field] === 'string') {
                    try {
                        values[field] = JSON.parse(values[field]);
                    } catch (e) {
                        console.warn(`Failed to parse ${field} JSON:`, values[field]);
                        // Set appropriate defaults
                        if (field === 'galleryImages' || field === 'sections' || field === 'trainerContent') {
                            values[field] = [];
                        } else if (field === 'theme' || field === 'socialLinks') {
                            values[field] = {};
                        }
                    }
                }
            });

            return values;
        }
    }

    TrainerSite.init({
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
        slug: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            validate: {
                // Allow alphanumeric with hyphens
                is: /^[a-z0-9-]+$/i
            }
        },
        headline: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        subheadline: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        philosophy: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        targetAudience: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        heroBackgroundImage: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        galleryImages: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Gallery images must be an array');
                    }
                }
            }
        },
        theme: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        sections: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Sections must be an array');
                    }
                }
            }
        },
        trainerContent: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            validate: {
                isArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error('Trainer content must be an array');
                    }
                }
            }
        },
        socialLinks: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {}
        },
        ctaText: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'archived'),
            allowNull: false,
            defaultValue: 'published',
            validate: {
                isIn: [['draft', 'published', 'archived']]
            }
        },
        viewCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        }
    }, {
        sequelize,
        modelName: 'TrainerSite',
        tableName: 'TrainerSites',
        underscored: false,
        indexes: [
            {
                unique: true,
                fields: ['userId']
            },
            {
                unique: true,
                fields: ['slug'],
                where: {
                    slug: {
                        [sequelize.Sequelize.Op.ne]: null
                    }
                }
            },
            {
                fields: ['status']
            }
        ]
    });

    return TrainerSite;
};

