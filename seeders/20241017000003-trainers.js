'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get the user IDs for trainer users
        const users = await queryInterface.sequelize.query(
            "SELECT id FROM users WHERE phone IN ('+251912345678', '+251923456789') ORDER BY id",
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length >= 2) {
            await queryInterface.bulkInsert('trainers', [
                {
                    userId: users[0].id, // Sara Bekele
                    bio: 'Certified fitness trainer with 5+ years of experience in strength training and cardio workouts. Passionate about helping people achieve their fitness goals.',
                    specialties: JSON.stringify(['strength_training', 'cardio', 'weight_loss']),
                    verified: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    userId: users[1].id, // Meron Tekle
                    bio: 'Yoga instructor and wellness coach specializing in flexibility and mindfulness. Focused on holistic health and mental well-being.',
                    specialties: JSON.stringify(['yoga', 'flexibility', 'mindfulness', 'meditation']),
                    verified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ], {});
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('trainers', null, {});
    }
};
