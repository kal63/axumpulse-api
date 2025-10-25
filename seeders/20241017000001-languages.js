'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('languages', [
            {
                code: 'en',
                name: 'English',
                nativeName: 'English',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'am',
                name: 'Amharic',
                nativeName: 'አማርኛ',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'fr',
                name: 'French',
                nativeName: 'Français',
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                code: 'es',
                name: 'Spanish',
                nativeName: 'Español',
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('languages', null, {});
    }
};
