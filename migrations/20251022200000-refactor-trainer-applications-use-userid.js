'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Step 1: Clean up existing data
        console.log('Cleaning up existing trainer applications...');
        await queryInterface.sequelize.query(
            'DELETE FROM CertificationFiles WHERE applicationId IN (SELECT id FROM TrainerApplications);'
        );
        await queryInterface.sequelize.query(
            'DELETE FROM TrainerApplications;'
        );
        console.log('Existing applications deleted.');

        // Step 2: Add userId column
        console.log('Adding userId column...');
        await queryInterface.addColumn('TrainerApplications', 'userId', {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
        });

        // Step 3: Add unique index on userId
        console.log('Adding unique index on userId...');
        await queryInterface.addIndex('TrainerApplications', ['userId'], {
            unique: true,
            name: 'idx_trainer_app_userId'
        });

        // Step 4: Remove unique constraint from phone (if exists)
        console.log('Removing unique constraint from phone...');
        try {
            await queryInterface.removeIndex('TrainerApplications', 'phone');
        } catch (error) {
            console.log('Phone unique index does not exist, skipping...');
        }

        // Step 5: Remove redundant columns
        console.log('Removing redundant columns...');
        await queryInterface.removeColumn('TrainerApplications', 'phone');
        await queryInterface.removeColumn('TrainerApplications', 'fullName');
        await queryInterface.removeColumn('TrainerApplications', 'email');
        await queryInterface.removeColumn('TrainerApplications', 'dateOfBirth');

        // Also remove profilePicture if it exists
        try {
            await queryInterface.removeColumn('TrainerApplications', 'profilePicture');
        } catch (error) {
            console.log('profilePicture column does not exist, skipping...');
        }

        console.log('Migration completed successfully!');
    },

    async down(queryInterface, Sequelize) {
        // Rollback: Add columns back
        console.log('Rolling back migration...');

        await queryInterface.addColumn('TrainerApplications', 'phone', {
            type: Sequelize.STRING(20),
            allowNull: true
        });

        await queryInterface.addColumn('TrainerApplications', 'fullName', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        await queryInterface.addColumn('TrainerApplications', 'email', {
            type: Sequelize.STRING(255),
            allowNull: true
        });

        await queryInterface.addColumn('TrainerApplications', 'dateOfBirth', {
            type: Sequelize.DATEONLY,
            allowNull: true
        });

        // Remove userId column and its index
        await queryInterface.removeIndex('TrainerApplications', 'idx_trainer_app_userId');
        await queryInterface.removeColumn('TrainerApplications', 'userId');

        console.log('Rollback completed!');
    }
};

