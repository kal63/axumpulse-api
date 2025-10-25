'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if table exists first
        const tableExists = await queryInterface.describeTable('Contents').catch(() => null);
        if (tableExists) {
            console.log('Contents table already exists, skipping creation');
            return;
        }

        await queryInterface.createTable('Contents', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            trainerId: { type: Sequelize.INTEGER, allowNull: false },
            title: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            type: { type: Sequelize.ENUM('video', 'image', 'document', 'workout_plan'), allowNull: false, defaultValue: 'video' },
            fileUrl: { type: Sequelize.STRING, allowNull: true },
            thumbnailUrl: { type: Sequelize.STRING, allowNull: true },
            duration: { type: Sequelize.INTEGER, allowNull: true },
            difficulty: { type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'), allowNull: true },
            category: { type: Sequelize.ENUM('cardio', 'strength', 'yoga', 'nutrition', 'wellness'), allowNull: true },
            language: { type: Sequelize.STRING(5), allowNull: true },
            tags: { type: Sequelize.JSON, allowNull: false, defaultValue: [] },
            status: { type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'draft' },
            rejectionReason: { type: Sequelize.TEXT, allowNull: true },
            views: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            likes: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
            isPublic: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        })

        // Add indexes only if they don't exist
        try {
            await queryInterface.addIndex('Contents', ['trainerId'], { name: 'contents_trainer_id_idx' })
        } catch (e) {
            // Index already exists, ignore
        }
        try {
            await queryInterface.addIndex('Contents', ['status'], { name: 'contents_status_idx' })
        } catch (e) {
            // Index already exists, ignore
        }
        try {
            await queryInterface.addIndex('Contents', ['type'], { name: 'contents_type_idx' })
        } catch (e) {
            // Index already exists, ignore
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Contents')
    }
}



