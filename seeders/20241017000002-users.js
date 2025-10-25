'use strict';

const bcrypt = require('bcrypt');

module.exports = {
    async up(queryInterface, Sequelize) {
        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const trainerPassword = await bcrypt.hash('trainer123', 10);
        const userPassword = await bcrypt.hash('user123', 10);

        await queryInterface.bulkInsert('users', [
            {
                phone: '+251911234567',
                email: 'admin@axumpulse.com',
                name: 'Admin User',
                passwordHash: adminPassword,
                isTrainer: false,
                isAdmin: true,
                status: 'active',
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                phone: '+251912345678',
                email: 'trainer1@axumpulse.com',
                name: 'Sara Bekele',
                passwordHash: trainerPassword,
                isTrainer: true,
                isAdmin: false,
                status: 'active',
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                phone: '+251923456789',
                email: 'trainer2@axumpulse.com',
                name: 'Meron Tekle',
                passwordHash: trainerPassword,
                isTrainer: true,
                isAdmin: false,
                status: 'active',
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                phone: '+251934567890',
                email: 'user1@axumpulse.com',
                name: 'Abebe Kebede',
                passwordHash: userPassword,
                isTrainer: false,
                isAdmin: false,
                status: 'active',
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                phone: '+251945678901',
                email: 'user2@axumpulse.com',
                name: 'Kebede Abebe',
                passwordHash: userPassword,
                isTrainer: false,
                isAdmin: false,
                status: 'blocked',
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('users', null, {});
    }
};
