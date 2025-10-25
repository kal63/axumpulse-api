'use strict'

module.exports = (sequelize, DataTypes) => {
    const Content = sequelize.define('Content', {
        // Relations
        trainerId: { type: DataTypes.INTEGER, allowNull: false },

        // Core fields
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: {
            type: DataTypes.ENUM('video', 'image', 'document'),
            allowNull: false,
            defaultValue: 'video'
        },
        fileUrl: { type: DataTypes.STRING, allowNull: true },
        thumbnailUrl: { type: DataTypes.STRING, allowNull: true },
        duration: { type: DataTypes.INTEGER, allowNull: true }, // seconds for videos
        difficulty: {
            type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('cardio', 'strength', 'yoga', 'nutrition', 'wellness'),
            allowNull: true
        },
        language: { type: DataTypes.STRING(5), allowNull: true },
        tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'draft'
        },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true },
        views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        likes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        tableName: 'Contents',
        underscored: false,
        indexes: [
            { fields: ['trainerId'], name: 'contents_trainer_id_idx' },
            { fields: ['status'], name: 'contents_status_idx' },
            { fields: ['type'], name: 'contents_type_idx' }
        ]
    })

    Content.associate = (models) => {
        Content.belongsTo(models.Trainer, { foreignKey: 'trainerId', as: 'trainer' })
        Content.hasMany(models.UserContentProgress, { foreignKey: 'contentId', as: 'userProgress' })
    }

    // Override toJSON to parse JSON fields that might be returned as strings
    Content.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());

        // Parse JSON fields that might be strings in production
        if (values.tags && typeof values.tags === 'string') {
            try {
                values.tags = JSON.parse(values.tags);
            } catch (e) {
                console.warn('Failed to parse tags JSON:', values.tags);
                values.tags = [];
            }
        }

        return values;
    }

    return Content
}



