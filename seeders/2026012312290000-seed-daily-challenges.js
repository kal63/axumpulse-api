'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get a trainer ID (or use null if no trainers exist)
    // Note: Trainers table uses userId as primary key, not id
    const [trainers] = await queryInterface.sequelize.query(
      "SELECT userId FROM Trainers LIMIT 1"
    );
    const trainerId = trainers.length > 0 ? trainers[0].userId : null;

    const dailyChallenges = [
      // Beginner challenges
      {
        title: '10 Squats',
        description: 'Complete 10 squats today to build leg strength',
        type: 'fitness',
        difficulty: 'beginner',
        fitnessLevel: 'beginner',
        xpReward: 50,
        requirements: 'Perform 10 bodyweight squats with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }), // Every day
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '5 Push-ups',
        description: 'Complete 5 push-ups to strengthen your upper body',
        type: 'fitness',
        difficulty: 'beginner',
        fitnessLevel: 'beginner',
        xpReward: 50,
        requirements: 'Perform 5 push-ups with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '1-Minute Plank',
        description: 'Hold a plank position for 1 minute to build core strength',
        type: 'fitness',
        difficulty: 'beginner',
        fitnessLevel: 'beginner',
        xpReward: 75,
        requirements: 'Hold a plank position for 60 seconds',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Intermediate challenges
      {
        title: '20 Squats',
        description: 'Complete 20 squats today to build leg strength',
        type: 'fitness',
        difficulty: 'intermediate',
        fitnessLevel: 'intermediate',
        xpReward: 75,
        requirements: 'Perform 20 bodyweight squats with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '10 Push-ups',
        description: 'Complete 10 push-ups to strengthen your upper body',
        type: 'fitness',
        difficulty: 'intermediate',
        fitnessLevel: 'intermediate',
        xpReward: 75,
        requirements: 'Perform 10 push-ups with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '2-Minute Plank',
        description: 'Hold a plank position for 2 minutes to build core strength',
        type: 'fitness',
        difficulty: 'intermediate',
        fitnessLevel: 'intermediate',
        xpReward: 100,
        requirements: 'Hold a plank position for 120 seconds',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Advanced challenges
      {
        title: '30 Squats',
        description: 'Complete 30 squats today to build leg strength',
        type: 'fitness',
        difficulty: 'advanced',
        fitnessLevel: 'advanced',
        xpReward: 100,
        requirements: 'Perform 30 bodyweight squats with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '15 Push-ups',
        description: 'Complete 15 push-ups to strengthen your upper body',
        type: 'fitness',
        difficulty: 'advanced',
        fitnessLevel: 'advanced',
        xpReward: 100,
        requirements: 'Perform 15 push-ups with proper form',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: '3-Minute Plank',
        description: 'Hold a plank position for 3 minutes to build core strength',
        type: 'fitness',
        difficulty: 'advanced',
        fitnessLevel: 'advanced',
        xpReward: 150,
        requirements: 'Hold a plank position for 180 seconds',
        isDailyChallenge: true,
        recurrencePattern: JSON.stringify({ days: [] }),
        autoAssign: true,
        isPublic: true,
        isTrainerCreated: trainerId ? true : false,
        trainerId: trainerId,
        status: 'approved',
        active: true,
        kind: 'daily_challenge',
        ruleJson: JSON.stringify({}),
        startTime: new Date(),
        endTime: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('Challenges', dailyChallenges);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Challenges', {
      isDailyChallenge: true
    });
  }
};

