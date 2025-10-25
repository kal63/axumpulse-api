'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('Achievements', [
      // COMMON Achievements - First Steps
      {
        name: 'First Step',
        description: 'Complete your first workout',
        icon: '👟',
        rarity: 'common',
        xpReward: 50,
        criteria: JSON.stringify({ type: 'workout_complete', value: 1 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Getting Started',
        description: 'Complete 5 workouts',
        icon: '🏃',
        rarity: 'common',
        xpReward: 100,
        criteria: JSON.stringify({ type: 'workout_complete', value: 5 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Early Bird',
        description: 'Complete a workout before 8 AM',
        icon: '🌅',
        rarity: 'common',
        xpReward: 75,
        criteria: JSON.stringify({ type: 'early_workout', value: 1 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Video Fan',
        description: 'Watch 5 training videos',
        icon: '📹',
        rarity: 'common',
        xpReward: 50,
        criteria: JSON.stringify({ type: 'video_watch', value: 5 }),
        createdAt: now,
        updatedAt: now
      },

      // RARE Achievements - Consistency
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day workout streak',
        icon: '🔥',
        rarity: 'rare',
        xpReward: 250,
        criteria: JSON.stringify({ type: 'streak', value: 7 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Dedicated',
        description: 'Complete 25 workouts',
        icon: '💪',
        rarity: 'rare',
        xpReward: 300,
        criteria: JSON.stringify({ type: 'workout_complete', value: 25 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Challenge Accepted',
        description: 'Complete your first challenge',
        icon: '🎯',
        rarity: 'rare',
        xpReward: 200,
        criteria: JSON.stringify({ type: 'challenge_complete', value: 1 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Plan Master',
        description: 'Complete a full workout plan',
        icon: '📋',
        rarity: 'rare',
        xpReward: 500,
        criteria: JSON.stringify({ type: 'plan_complete', value: 1 }),
        createdAt: now,
        updatedAt: now
      },

      // EPIC Achievements - Milestones
      {
        name: 'Month Champion',
        description: 'Maintain a 30-day workout streak',
        icon: '🏆',
        rarity: 'epic',
        xpReward: 1000,
        criteria: JSON.stringify({ type: 'streak', value: 30 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Fitness Enthusiast',
        description: 'Complete 50 workouts',
        icon: '⭐',
        rarity: 'epic',
        xpReward: 750,
        criteria: JSON.stringify({ type: 'workout_complete', value: 50 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Challenge Hunter',
        description: 'Complete 5 challenges',
        icon: '🎖️',
        rarity: 'epic',
        xpReward: 800,
        criteria: JSON.stringify({ type: 'challenge_complete', value: 5 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Level 10',
        description: 'Reach Level 10',
        icon: '🌟',
        rarity: 'epic',
        xpReward: 500,
        criteria: JSON.stringify({ type: 'level_reach', value: 10 }),
        createdAt: now,
        updatedAt: now
      },

      // LEGENDARY Achievements - Ultimate Goals
      {
        name: 'Streak Master',
        description: 'Maintain a 100-day workout streak',
        icon: '🔥',
        rarity: 'legendary',
        xpReward: 5000,
        criteria: JSON.stringify({ type: 'streak', value: 100 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Century Club',
        description: 'Complete 100 workouts',
        icon: '💯',
        rarity: 'legendary',
        xpReward: 2000,
        criteria: JSON.stringify({ type: 'workout_complete', value: 100 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Ultimate Champion',
        description: 'Complete 10 challenges',
        icon: '👑',
        rarity: 'legendary',
        xpReward: 3000,
        criteria: JSON.stringify({ type: 'challenge_complete', value: 10 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Level 25',
        description: 'Reach Level 25',
        icon: '💎',
        rarity: 'legendary',
        xpReward: 2500,
        criteria: JSON.stringify({ type: 'level_reach', value: 25 }),
        createdAt: now,
        updatedAt: now
      },

      // Special Achievements
      {
        name: 'Social Butterfly',
        description: 'Like 50 videos',
        icon: '❤️',
        rarity: 'common',
        xpReward: 100,
        criteria: JSON.stringify({ type: 'like_count', value: 50 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Content Creator',
        description: 'Save 25 videos for later',
        icon: '💾',
        rarity: 'common',
        xpReward: 75,
        criteria: JSON.stringify({ type: 'save_count', value: 25 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Weekend Warrior',
        description: 'Complete workouts on 10 weekends',
        icon: '🗓️',
        rarity: 'rare',
        xpReward: 300,
        criteria: JSON.stringify({ type: 'weekend_workouts', value: 10 }),
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'All-Rounder',
        description: 'Complete workout plans in 3 different categories',
        icon: '🎨',
        rarity: 'epic',
        xpReward: 600,
        criteria: JSON.stringify({ type: 'category_diversity', value: 3 }),
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Achievements', null, {});
  }
};