'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('challenges', [
            {
                title: '30-Day Fitness Challenge',
                description: 'Complete a workout every day for 30 days to build a healthy habit.',
                kind: 'daily',
                ruleJson: JSON.stringify({
                    target: 'workout',
                    frequency: 'daily',
                    duration: 30,
                    points: 100
                }),
                startTime: new Date(),
                endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                active: true,
                createdBy: null, // Will be set to admin user ID dynamically
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Weekly Water Intake',
                description: 'Drink 8 glasses of water every day for a week.',
                kind: 'weekly',
                ruleJson: JSON.stringify({
                    target: 'water',
                    frequency: 'daily',
                    amount: 8,
                    unit: 'glasses',
                    points: 50
                }),
                startTime: new Date(),
                endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                active: true,
                createdBy: null, // Will be set to admin user ID dynamically
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'One-Time Achievement',
                description: 'Complete your first workout to unlock this achievement.',
                kind: 'oneoff',
                ruleJson: JSON.stringify({
                    target: 'workout',
                    frequency: 'once',
                    points: 25
                }),
                startTime: null,
                endTime: null,
                active: true,
                createdBy: null, // Will be set to admin user ID dynamically
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                title: 'Inactive Challenge',
                description: 'This challenge is no longer active.',
                kind: 'daily',
                ruleJson: JSON.stringify({
                    target: 'steps',
                    frequency: 'daily',
                    amount: 10000,
                    points: 30
                }),
                startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                active: false,
                createdBy: null, // Will be set to admin user ID dynamically
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('challenges', null, {});
    }
};
