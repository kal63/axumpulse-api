'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const games = [
      // Spin & Win Game
      {
        gameType: 'spin_win',
        title: 'Spin & Win Workouts',
        description: 'Spin the wheel and get a random exercise to complete!',
        configJson: JSON.stringify({
          exercises: [
            { name: 'Push-ups', muscleGroup: 'Chest, Triceps', description: 'Upper body strength exercise' },
            { name: 'Squats', muscleGroup: 'Legs, Glutes', description: 'Lower body strength exercise' },
            { name: 'Plank', muscleGroup: 'Core', description: 'Core stability exercise' },
            { name: 'Jumping Jacks', muscleGroup: 'Full Body', description: 'Cardio exercise' },
            { name: 'Burpees', muscleGroup: 'Full Body', description: 'High-intensity exercise' },
            { name: 'Lunges', muscleGroup: 'Legs', description: 'Lower body exercise' },
            { name: 'Mountain Climbers', muscleGroup: 'Core, Cardio', description: 'Core and cardio exercise' },
            { name: 'High Knees', muscleGroup: 'Legs, Cardio', description: 'Cardio exercise' }
          ]
        }),
        xpReward: 50,
        active: true,
        difficulty: 'beginner',
        useAiGeneration: false,
        aiPromptTemplate: null,
        cachedContent: null,
        cacheExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Quiz Battle Game
      {
        gameType: 'quiz_battle',
        title: 'Fitness Quiz Battle',
        description: 'Test your fitness knowledge with AI-generated quiz questions!',
        configJson: JSON.stringify({}),
        xpReward: 50,
        active: true,
        difficulty: 'beginner',
        useAiGeneration: true,
        aiPromptTemplate: 'Generate 5 fitness and health quiz questions for a beginner level user. Each question should have a clear question about fitness, nutrition, exercise form, or health, 4 multiple choice answers (A, B, C, D), one correct answer, and a brief explanation.',
        cachedContent: null,
        cacheExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Memory Game
      {
        gameType: 'memory_game',
        title: 'Workout Memory Game',
        description: 'Match exercise pairs and improve your memory!',
        configJson: JSON.stringify({}),
        xpReward: 50,
        active: true,
        difficulty: 'beginner',
        useAiGeneration: true,
        aiPromptTemplate: 'Generate 8 pairs of fitness exercises for a memory matching game. Each pair should be related (same muscle group, similar movement, or complementary exercises). For beginner level users.',
        cachedContent: null,
        cacheExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Games', games);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Games', {});
  }
};

