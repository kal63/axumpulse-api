'use strict';

const { User, UserProfile } = require('../models');

/**
 * Calculate level from XP
 * Level formula: Level = floor(sqrt(XP / 100)) + 1
 * @param {number} xp - Total XP
 * @returns {number} - Level
 */
function calculateLevel(xp) {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Get XP required for a specific level
 * @param {number} level - Target level
 * @returns {number} - XP required
 */
function getLevelXP(level) {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
}

/**
 * Award XP to a user
 * @param {number} userId - User ID
 * @param {number} xpAmount - Amount of XP to award
 * @param {string} source - Source of XP (e.g., 'daily_challenge', 'game', 'challenge', 'content')
 * @param {string} reason - Reason for XP award
 * @returns {Promise<Object>} - Result with new XP, level, and level up status
 */
async function awardXP(userId, xpAmount, source = 'unknown', reason = 'XP awarded') {
    if (!userId || !xpAmount || xpAmount <= 0) {
        throw new Error('Invalid parameters: userId and positive xpAmount required');
    }

    // Get or create user profile
    let profile = await UserProfile.findOne({ where: { userId } });
    
    if (!profile) {
        // Create profile if it doesn't exist
        profile = await UserProfile.create({
            userId,
            totalXp: 0,
            challengesCompleted: 0,
            workoutsCompleted: 0
        });
    }

    // Get current XP and level
    const currentXP = profile.totalXp || 0;
    const currentLevel = calculateLevel(currentXP);

    // Add XP
    const newXP = currentXP + parseInt(xpAmount);
    profile.totalXp = newXP;

    // Calculate new level
    const newLevel = calculateLevel(newXP);
    const leveledUp = newLevel > currentLevel;

    // Save profile
    await profile.save();

    return {
        userId,
        xp: newXP,
        xpAdded: parseInt(xpAmount),
        level: newLevel,
        previousLevel: currentLevel,
        leveledUp,
        source,
        reason
    };
}

/**
 * Update daily challenge streak
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Updated streak information
 */
async function updateDailyChallengeStreak(userId) {
    const profile = await UserProfile.findOne({ where: { userId } });
    
    if (!profile) {
        throw new Error('User profile not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDate = today.toISOString().split('T')[0];

    const lastDate = profile.lastDailyChallengeDate 
        ? new Date(profile.lastDailyChallengeDate).toISOString().split('T')[0]
        : null;

    let newStreak = profile.dailyChallengeStreak || 0;

    if (!lastDate) {
        // First daily challenge completion
        newStreak = 1;
    } else {
        const lastDateObj = new Date(lastDate);
        const daysDiff = Math.floor((today - lastDateObj) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
            // Already completed today, don't increment
            // Keep current streak
        } else if (daysDiff === 1) {
            // Consecutive day, increment streak
            newStreak += 1;
        } else {
            // Streak broken, reset to 1
            newStreak = 1;
        }
    }

    profile.dailyChallengeStreak = newStreak;
    profile.lastDailyChallengeDate = todayDate;
    await profile.save();

    return {
        userId,
        streak: newStreak,
        lastDate: todayDate
    };
}

/**
 * Award XP for daily challenge completion
 * @param {number} userId - User ID
 * @param {number} xpAmount - XP amount from challenge
 * @param {number} challengeId - Challenge ID
 * @returns {Promise<Object>} - Result with XP and streak info
 */
async function awardDailyChallengeXP(userId, xpAmount, challengeId) {
    // Award XP
    const xpResult = await awardXP(
        userId,
        xpAmount,
        'daily_challenge',
        `Completed daily challenge ${challengeId}`
    );

    // Update streak
    const streakResult = await updateDailyChallengeStreak(userId);

    return {
        ...xpResult,
        streak: streakResult.streak
    };
}

/**
 * Award XP for game completion
 * @param {number} userId - User ID
 * @param {number} xpAmount - XP amount from game
 * @param {number} gameId - Game ID
 * @param {string} gameType - Type of game
 * @returns {Promise<Object>} - Result with XP info
 */
async function awardGameXP(userId, xpAmount, gameId, gameType) {
    return await awardXP(
        userId,
        xpAmount,
        'game',
        `Completed ${gameType} game ${gameId}`
    );
}

/**
 * Get user's XP and level information
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - User XP and level info
 */
async function getUserXPInfo(userId) {
    const profile = await UserProfile.findOne({ where: { userId } });
    
    if (!profile) {
        return {
            userId,
            xp: 0,
            level: 1,
            xpToNextLevel: 100,
            xpProgress: 0,
            xpProgressPercent: 0
        };
    }

    const xp = profile.totalXp || 0;
    const level = calculateLevel(xp);
    const currentLevelXP = getLevelXP(level);
    const nextLevelXP = getLevelXP(level + 1);
    const xpProgress = xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const xpProgressPercent = xpNeeded > 0 ? (xpProgress / xpNeeded) * 100 : 100;

    return {
        userId,
        xp,
        level,
        xpToNextLevel: xpNeeded,
        xpProgress,
        xpProgressPercent: Math.min(100, Math.max(0, xpProgressPercent)),
        streak: profile.dailyChallengeStreak || 0
    };
}

module.exports = {
    calculateLevel,
    getLevelXP,
    awardXP,
    updateDailyChallengeStreak,
    awardDailyChallengeXP,
    awardGameXP,
    getUserXPInfo
};

