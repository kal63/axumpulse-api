'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Get existing users to create profiles for them
        const users = await queryInterface.sequelize.query(
            'SELECT id FROM users ORDER BY id',
            { type: Sequelize.QueryTypes.SELECT }
        );

        const userProfiles = users.map((user, index) => ({
            userId: user.id,

            // Activity & Progress - vary the data
            totalXp: Math.floor(Math.random() * 5000) + 100,
            challengesCompleted: Math.floor(Math.random() * 20) + 1,
            workoutsCompleted: Math.floor(Math.random() * 50) + 5,

            // Subscription - mix of premium and pro
            subscriptionTier: index % 3 === 0 ? 'pro' : 'premium',

            // Preferences
            language: index % 2 === 0 ? 'en' : 'am',
            notificationSettings: JSON.stringify({
                email: true,
                push: true,
                sms: index % 3 === 0,
                challenges: true,
                workouts: true,
                achievements: true
            }),

            // Additional user-specific data
            fitnessGoals: JSON.stringify({
                primaryGoal: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility'][index % 4],
                targetWeight: 70 + Math.random() * 20,
                weeklyWorkouts: 3 + Math.floor(Math.random() * 4),
                experience: ['beginner', 'intermediate', 'advanced'][index % 3]
            }),
            healthMetrics: JSON.stringify({
                height: 160 + Math.random() * 30,
                currentWeight: 60 + Math.random() * 30,
                bodyFat: 10 + Math.random() * 15,
                lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            }),
            preferences: JSON.stringify({
                workoutTypes: ['cardio', 'strength', 'yoga', 'hiit'].slice(0, 2 + Math.floor(Math.random() * 2)),
                preferredTime: ['morning', 'afternoon', 'evening'][index % 3],
                difficulty: ['beginner', 'intermediate', 'advanced'][index % 3],
                musicPreference: ['upbeat', 'calm', 'no_music'][index % 3]
            }),

            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await queryInterface.bulkInsert('user_profiles', userProfiles);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('user_profiles', null, {});
    }
};
