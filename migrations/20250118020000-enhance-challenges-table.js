'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if columns exist before adding them
        const tableDescription = await queryInterface.describeTable('Challenges');

        // Add new columns to the Challenges table only if they don't exist
        if (!tableDescription.type) {
            await queryInterface.addColumn('Challenges', 'type', {
                type: Sequelize.ENUM('fitness', 'nutrition', 'wellness', 'achievement'),
                allowNull: true,
                defaultValue: 'fitness'
            });
        }

        if (!tableDescription.difficulty) {
            await queryInterface.addColumn('Challenges', 'difficulty', {
                type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
                allowNull: true,
                defaultValue: 'beginner'
            });
        }

        if (!tableDescription.duration) {
            await queryInterface.addColumn('Challenges', 'duration', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 7
            });
        }

        if (!tableDescription.xpReward) {
            await queryInterface.addColumn('Challenges', 'xpReward', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 100
            });
        }

        if (!tableDescription.requirements) {
            await queryInterface.addColumn('Challenges', 'requirements', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {}
            });
        }

        if (!tableDescription.contentIds) {
            await queryInterface.addColumn('Challenges', 'contentIds', {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: []
            });
        }

        if (!tableDescription.language) {
            await queryInterface.addColumn('Challenges', 'language', {
                type: Sequelize.STRING(5),
                allowNull: true,
                defaultValue: 'en'
            });
        }

        if (!tableDescription.status) {
            await queryInterface.addColumn('Challenges', 'status', {
                type: Sequelize.ENUM('draft', 'pending', 'approved', 'rejected', 'active'),
                allowNull: true,
                defaultValue: 'draft'
            });
        }

        if (!tableDescription.rejectionReason) {
            await queryInterface.addColumn('Challenges', 'rejectionReason', {
                type: Sequelize.TEXT,
                allowNull: true
            });
        }

        if (!tableDescription.participantCount) {
            await queryInterface.addColumn('Challenges', 'participantCount', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            });
        }

        if (!tableDescription.completionCount) {
            await queryInterface.addColumn('Challenges', 'completionCount', {
                type: Sequelize.INTEGER,
                allowNull: true,
                defaultValue: 0
            });
        }

        if (!tableDescription.isPublic) {
            await queryInterface.addColumn('Challenges', 'isPublic', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: true
            });
        }

        if (!tableDescription.isTrainerCreated) {
            await queryInterface.addColumn('Challenges', 'isTrainerCreated', {
                type: Sequelize.BOOLEAN,
                allowNull: true,
                defaultValue: false
            });
        }

        if (!tableDescription.trainerId) {
            await queryInterface.addColumn('Challenges', 'trainerId', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'trainers',
                    key: 'userId'
                }
            });
        }

        // Add indexes for better performance (only if they don't exist)
        try {
            await queryInterface.addIndex('Challenges', ['trainerId']);
        } catch (error) {
            // Index might already exist, ignore error
        }
        try {
            await queryInterface.addIndex('Challenges', ['status']);
        } catch (error) {
            // Index might already exist, ignore error
        }
        try {
            await queryInterface.addIndex('Challenges', ['type']);
        } catch (error) {
            // Index might already exist, ignore error
        }
        try {
            await queryInterface.addIndex('Challenges', ['difficulty']);
        } catch (error) {
            // Index might already exist, ignore error
        }
        try {
            await queryInterface.addIndex('Challenges', ['isPublic']);
        } catch (error) {
            // Index might already exist, ignore error
        }
        try {
            await queryInterface.addIndex('Challenges', ['isTrainerCreated']);
        } catch (error) {
            // Index might already exist, ignore error
        }
    },

    async down(queryInterface, Sequelize) {
        // Remove indexes
        await queryInterface.removeIndex('Challenges', ['trainerId']);
        await queryInterface.removeIndex('Challenges', ['status']);
        await queryInterface.removeIndex('Challenges', ['type']);
        await queryInterface.removeIndex('Challenges', ['difficulty']);
        await queryInterface.removeIndex('Challenges', ['isPublic']);
        await queryInterface.removeIndex('Challenges', ['isTrainerCreated']);

        // Remove columns
        await queryInterface.removeColumn('Challenges', 'trainerId');
        await queryInterface.removeColumn('Challenges', 'isTrainerCreated');
        await queryInterface.removeColumn('Challenges', 'isPublic');
        await queryInterface.removeColumn('Challenges', 'completionCount');
        await queryInterface.removeColumn('Challenges', 'participantCount');
        await queryInterface.removeColumn('Challenges', 'rejectionReason');
        await queryInterface.removeColumn('Challenges', 'status');
        await queryInterface.removeColumn('Challenges', 'language');
        await queryInterface.removeColumn('Challenges', 'contentIds');
        await queryInterface.removeColumn('Challenges', 'requirements');
        await queryInterface.removeColumn('Challenges', 'xpReward');
        await queryInterface.removeColumn('Challenges', 'duration');
        await queryInterface.removeColumn('Challenges', 'difficulty');
        await queryInterface.removeColumn('Challenges', 'type');
    }
};
