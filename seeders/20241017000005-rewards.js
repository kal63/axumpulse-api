'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('rewards', [
            {
                title: 'Premium Workout Plan',
                costXp: 500,
                active: true,
                stock: 100,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Nutrition Consultation',
                costXp: 750,
                active: true,
                stock: 50,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Fitness Tracker',
                costXp: 2000,
                active: true,
                stock: 25,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Personal Training Session',
                costXp: 1000,
                active: true,
                stock: 10,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Limited Edition T-Shirt',
                costXp: 300,
                active: true,
                stock: 0, // Out of stock
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Inactive Reward',
                costXp: 100,
                active: false,
                stock: 5,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('rewards', null, {});
    }
};
