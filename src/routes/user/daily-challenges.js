'use strict';

const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { Challenge, DailyChallengeProgress, UserProfile } = require('../../models');
const { Op } = require('sequelize');
const { awardDailyChallengeXP, getUserXPInfo } = require('../../services/xpService');
const requireAuth = require('../../middleware/auth').requireAuth;

// All routes require authentication
router.use(requireAuth);

/**
 * Get today's available daily challenges for the user
 * Filters by user's fitness level
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDate = today.toISOString().split('T')[0];

        // Get user profile to determine fitness level
        const profile = await UserProfile.findOne({ where: { userId } });
        // For now, we'll use difficulty as fitness level if fitnessLevel is not set
        // This can be enhanced later to have a separate fitnessLevel field in UserProfile
        const userFitnessLevel = profile?.fitnessGoals?.fitnessLevel || 'beginner';

        // Get today's date for recurrence pattern check
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Find active daily challenges
        const whereClause = {
            isDailyChallenge: true,
            status: 'approved',
            isPublic: true,
            active: true,
            [Op.or]: [
                { fitnessLevel: userFitnessLevel },
                { fitnessLevel: null } // Challenges without specific fitness level
            ]
        };

        // Check recurrence pattern if set
        const challenges = await Challenge.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        // Filter by recurrence pattern
        const availableChallenges = challenges.filter(challenge => {
            const pattern = challenge.recurrencePattern || {};
            const days = pattern.days || [];
            
            // If no days specified, challenge is available every day
            if (days.length === 0) return true;
            
            // Check if today's day is in the pattern
            return days.includes(dayOfWeek);
        });

        // Get completion status for each challenge
        const challengeIds = availableChallenges.map(c => c.id);
        const completions = await DailyChallengeProgress.findAll({
            where: {
                userId,
                challengeId: { [Op.in]: challengeIds },
                completionDate: todayDate
            }
        });

        const completionMap = new Map();
        completions.forEach(completion => {
            completionMap.set(completion.challengeId, completion);
        });

        // Format response
        const challengesWithStatus = availableChallenges.map(challenge => {
            const completion = completionMap.get(challenge.id);
            return {
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                type: challenge.type,
                difficulty: challenge.difficulty,
                fitnessLevel: challenge.fitnessLevel,
                xpReward: challenge.xpReward,
                requirements: challenge.requirements,
                completed: !!completion,
                completedAt: completion?.completedAt || null,
                xpEarned: completion?.xpEarned || 0
            };
        });

        ok(res, {
            challenges: challengesWithStatus,
            date: todayDate
        });
    } catch (error) {
        console.error('Error fetching daily challenges:', error);
        err(res, error);
    }
});

/**
 * Get user's today's challenges with completion status
 */
router.get('/today', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDate = today.toISOString().split('T')[0];

        // Get user profile
        const profile = await UserProfile.findOne({ where: { userId } });
        const userFitnessLevel = profile?.fitnessGoals?.fitnessLevel || 'beginner';

        const dayOfWeek = today.getDay();

        // Find daily challenges
        const challenges = await Challenge.findAll({
            where: {
                isDailyChallenge: true,
                status: 'approved',
                isPublic: true,
                active: true,
                [Op.or]: [
                    { fitnessLevel: userFitnessLevel },
                    { fitnessLevel: null }
                ]
            }
        });

        // Filter by recurrence
        const availableChallenges = challenges.filter(challenge => {
            const pattern = challenge.recurrencePattern || {};
            const days = pattern.days || [];
            if (days.length === 0) return true;
            return days.includes(dayOfWeek);
        });

        // Get completions
        const challengeIds = availableChallenges.map(c => c.id);
        const completions = await DailyChallengeProgress.findAll({
            where: {
                userId,
                challengeId: { [Op.in]: challengeIds },
                completionDate: todayDate
            }
        });

        const completionMap = new Map();
        completions.forEach(completion => {
            completionMap.set(completion.challengeId, completion);
        });

        const challengesWithStatus = availableChallenges.map(challenge => {
            const completion = completionMap.get(challenge.id);
            return {
                ...challenge.toJSON(),
                completed: !!completion,
                completedAt: completion?.completedAt || null,
                xpEarned: completion?.xpEarned || 0
            };
        });

        ok(res, {
            challenges: challengesWithStatus,
            date: todayDate,
            completedCount: completions.length,
            totalCount: challengesWithStatus.length
        });
    } catch (error) {
        console.error('Error fetching today\'s challenges:', error);
        err(res, error);
    }
});

/**
 * Mark daily challenge as completed
 */
router.post('/:id/complete', async (req, res) => {
    try {
        const userId = req.user.id;
        const challengeId = parseInt(req.params.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDate = today.toISOString().split('T')[0];

        // Verify challenge exists and is a daily challenge
        const challenge = await Challenge.findOne({
            where: {
                id: challengeId,
                isDailyChallenge: true,
                status: 'approved',
                active: true
            }
        });

        if (!challenge) {
            return err(res, { 
                code: 'NOT_FOUND', 
                message: 'Daily challenge not found or not available' 
            }, 404);
        }

        // Check if already completed today
        const existingCompletion = await DailyChallengeProgress.findOne({
            where: {
                userId,
                challengeId,
                completionDate: todayDate
            }
        });

        if (existingCompletion) {
            return ok(res, {
                message: 'Challenge already completed today',
                completion: existingCompletion,
                xpEarned: existingCompletion.xpEarned
            });
        }

        // Award XP and update streak
        const xpResult = await awardDailyChallengeXP(
            userId,
            challenge.xpReward || 100,
            challengeId
        );

        // Create completion record
        const completion = await DailyChallengeProgress.create({
            userId,
            challengeId,
            completionDate: todayDate,
            xpEarned: challenge.xpReward || 100,
            completedAt: new Date()
        });

        ok(res, {
            message: 'Daily challenge completed!',
            completion: completion.toJSON(),
            xp: xpResult.xp,
            xpAdded: xpResult.xpAdded,
            level: xpResult.level,
            leveledUp: xpResult.leveledUp,
            streak: xpResult.streak
        });
    } catch (error) {
        console.error('Error completing daily challenge:', error);
        err(res, error);
    }
});

/**
 * Get user's current streak
 */
router.get('/streak', async (req, res) => {
    try {
        const userId = req.user.id;
        const xpInfo = await getUserXPInfo(userId);

        ok(res, {
            streak: xpInfo.streak || 0,
            xp: xpInfo.xp,
            level: xpInfo.level
        });
    } catch (error) {
        console.error('Error fetching streak:', error);
        err(res, error);
    }
});

module.exports = { router };

