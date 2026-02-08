'use strict';

const { Game, WorkoutPlan, UserProfile } = require('../models');
const { Op } = require('sequelize');
const { 
    generateQuizWithGemini, 
    generateMemoryGameWithGemini 
} = require('../utils/geminiGameGenerator');

/**
 * Spin & Win - Random workout plan selection from workout plans with isGameChallenge flag
 * @param {Object} game - Game model instance
 * @param {Array} wheelWorkouts - Optional array of workout plan IDs/titles that are on the wheel (for better randomization)
 * @param {Array} recentSelections - Optional array of recently selected workout plan IDs to avoid immediate repeats
 * @returns {Promise<Object>} - Selected workout plan with all details
 */
async function spinAndWin(game, wheelWorkouts = null, recentSelections = []) {
    try {
        let workoutPlans = [];

        // If wheel workouts are provided, only select from those
        if (wheelWorkouts && Array.isArray(wheelWorkouts) && wheelWorkouts.length > 0) {
            // Extract workout plan IDs or titles from wheel workouts
            const wheelIds = wheelWorkouts.map(wp => wp.id || wp.workoutPlanId).filter(Boolean);
            const wheelTitles = wheelWorkouts.map(wp => wp.title || wp.name).filter(Boolean);

            // Fetch workout plans that match the wheel
            const whereClause = {
                isGameChallenge: true
            };

            // Build OR condition for IDs or titles
            if (wheelIds.length > 0 && wheelTitles.length > 0) {
                whereClause[Op.or] = [
                    { id: { [Op.in]: wheelIds } },
                    { title: { [Op.in]: wheelTitles } }
                ];
            } else if (wheelIds.length > 0) {
                whereClause.id = { [Op.in]: wheelIds };
            } else if (wheelTitles.length > 0) {
                whereClause.title = { [Op.in]: wheelTitles };
            }

            workoutPlans = await WorkoutPlan.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Fallback: fetch all game workout plans
            const whereClause = {
                isGameChallenge: true
            };

            // Optionally filter by difficulty if game has one
            if (game.difficulty) {
                whereClause.difficulty = game.difficulty;
            }

            // Optionally filter by category if game config specifies
            const config = game.configJson || {};
            if (config.workoutCategory) {
                whereClause.category = config.workoutCategory;
            }

            workoutPlans = await WorkoutPlan.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: 100
            });
        }

        if (workoutPlans.length === 0) {
            throw new Error('No workout plans available for Spin & Win game. Mark workout plans as "Game Challenge" to make them available.');
        }

        // Filter out recently selected workout plans to avoid immediate repeats
        let availableWorkoutPlans = workoutPlans;
        if (recentSelections && recentSelections.length > 0 && workoutPlans.length > recentSelections.length) {
            const beforeFilter = availableWorkoutPlans.length;
            availableWorkoutPlans = workoutPlans.filter(wp => !recentSelections.includes(wp.id));
            // If filtering removed all workout plans, use all workout plans (better than nothing)
            if (availableWorkoutPlans.length === 0) {
                console.log('[spinAndWin] All workout plans were in recent selections, using all workout plans');
                availableWorkoutPlans = workoutPlans;
            } else {
                console.log(`[spinAndWin] Filtered out ${beforeFilter - availableWorkoutPlans.length} recently selected workout plans`);
            }
        }

        console.log(`[spinAndWin] Selecting from ${availableWorkoutPlans.length} available workout plans`);

        // Improved randomization using crypto for better randomness
        let selectedWorkoutPlan;
        if (availableWorkoutPlans.length === 1) {
            selectedWorkoutPlan = availableWorkoutPlans[0];
            console.log(`[spinAndWin] Only one workout plan available, selected: ${selectedWorkoutPlan.title}`);
        } else {
            // Use crypto.randomInt for better randomness (Node.js 14.17.0+)
            // Fallback to Math.random if crypto.randomInt is not available
            let randomIndex;
            try {
                const crypto = require('crypto');
                randomIndex = crypto.randomInt(0, availableWorkoutPlans.length);
            } catch (e) {
                // Fallback to Math.random with better distribution
                randomIndex = Math.floor(Math.random() * availableWorkoutPlans.length);
            }
            selectedWorkoutPlan = availableWorkoutPlans[randomIndex];
            console.log(`[spinAndWin] Randomly selected workout plan ${randomIndex + 1}/${availableWorkoutPlans.length}: ${selectedWorkoutPlan.title} (ID: ${selectedWorkoutPlan.id})`);
        }

        // Format workout plan to match expected exercise structure
        // Use default XP since WorkoutPlan doesn't have xpReward field
        return {
            title: selectedWorkoutPlan.title,
            name: selectedWorkoutPlan.title, // For backward compatibility
            description: selectedWorkoutPlan.description || null,
            requirements: null, // WorkoutPlan doesn't have requirements field
            difficulty: selectedWorkoutPlan.difficulty || 'beginner',
            type: selectedWorkoutPlan.category || 'fitness',
            xpReward: game.xpReward || 50, // Use game XP since WorkoutPlan doesn't have xpReward
            category: selectedWorkoutPlan.category || 'fitness',
            muscleGroup: null,
            muscleGroups: null,
            workoutPlanId: selectedWorkoutPlan.id, // Include workout plan ID for reference
            challengeId: selectedWorkoutPlan.id // Keep for backward compatibility
        };
    } catch (error) {
        console.error('Error fetching workout plans for Spin & Win:', error);
        throw error;
    }
}

/**
 * Generate quiz game content
 * @param {Object} game - Game model instance
 * @param {boolean} useCache - Whether to use cached content if available
 * @returns {Promise<Object>} - Quiz questions
 */
async function generateQuiz(game, useCache = true) {
    // Check cache if enabled
    if (useCache && game.cachedContent && game.cacheExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(game.cacheExpiresAt);
        
        if (now < expiresAt) {
            // Cache is valid, return cached content
            return {
                questions: game.cachedContent.questions || [],
                cached: true
            };
        }
    }
    
    // Generate new content using Gemini
    if (!game.useAiGeneration) {
        // Fallback to static content if AI generation is disabled
        const config = game.configJson || {};
        return {
            questions: config.questions || [],
            cached: false
        };
    }
    
    try {
        const questions = await generateQuizWithGemini(
            game.difficulty || 'beginner',
            null, // topic - can be extended later
            5 // default number of questions
        );
        
        // Update cache
        const cacheExpiresAt = new Date();
        cacheExpiresAt.setHours(cacheExpiresAt.getHours() + 24); // 24 hour cache
        
        await game.update({
            cachedContent: { questions },
            cacheExpiresAt
        });
        
        return {
            questions,
            cached: false
        };
    } catch (error) {
        console.error('Failed to generate quiz with Gemini, using fallback:', error);
        
        // Fallback to static content
        const config = game.configJson || {};
        return {
            questions: config.questions || [],
            cached: false,
            fallback: true
        };
    }
}

/**
 * Generate memory game content
 * @param {Object} game - Game model instance
 * @param {boolean} useCache - Whether to use cached content if available
 * @returns {Promise<Object>} - Exercise pairs for memory game
 */
async function generateMemoryGame(game, useCache = true) {
    // Check cache if enabled
    if (useCache && game.cachedContent && game.cacheExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(game.cacheExpiresAt);
        
        if (now < expiresAt) {
            // Cache is valid, return cached content
            return {
                pairs: game.cachedContent.pairs || [],
                cached: true
            };
        }
    }
    
    // Generate new content using Gemini
    if (!game.useAiGeneration) {
        // Fallback to static content if AI generation is disabled
        const config = game.configJson || {};
        return {
            pairs: config.pairs || [],
            cached: false
        };
    }
    
    try {
        const pairs = await generateMemoryGameWithGemini(
            game.difficulty || 'beginner',
            8 // default number of pairs (16 tiles)
        );
        
        // Update cache
        const cacheExpiresAt = new Date();
        cacheExpiresAt.setHours(cacheExpiresAt.getHours() + 24); // 24 hour cache
        
        await game.update({
            cachedContent: { pairs },
            cacheExpiresAt
        });
        
        return {
            pairs,
            cached: false
        };
    } catch (error) {
        console.error('Failed to generate memory game with Gemini, using fallback:', error);
        
        // Fallback to static content
        const config = game.configJson || {};
        return {
            pairs: config.pairs || [],
            cached: false,
            fallback: true
        };
    }
}

/**
 * Calculate game score
 * @param {string} gameType - Type of game
 * @param {Object} gameData - Game-specific data (answers, matches, etc.)
 * @param {Object} game - Game model instance
 * @returns {Object} - Score and XP earned
 */
function calculateGameScore(gameType, gameData, game) {
    let score = 0;
    let xpEarned = 0;
    
    switch (gameType) {
        case 'quiz_battle':
            // Calculate score based on correct answers
            const questions = gameData.questions || [];
            const answers = gameData.answers || [];
            
            let correctCount = 0;
            questions.forEach((q, index) => {
                if (answers[index] === q.correctIndex) {
                    correctCount++;
                }
            });
            
            score = correctCount;
            // XP is proportional to correct answers, with bonus for perfect score
            const baseXP = game.xpReward || 50;
            const percentage = questions.length > 0 ? correctCount / questions.length : 0;
            xpEarned = Math.floor(baseXP * percentage);
            
            if (correctCount === questions.length && questions.length > 0) {
                // Perfect score bonus
                xpEarned = Math.floor(baseXP * 1.2);
            }
            break;
            
        case 'memory_game':
            // Calculate score based on matches and time
            const matches = gameData.matches || 0;
            const totalPairs = gameData.totalPairs || 0;
            const timeTaken = gameData.timeTaken || 0; // in seconds
            const attempts = gameData.attempts || 0;
            
            // Base score from matches
            score = matches;
            
            // XP calculation: base XP * (matches/totalPairs) with time/attempts bonus
            const baseXP_memory = game.xpReward || 50;
            const matchPercentage = totalPairs > 0 ? matches / totalPairs : 0;
            let xpMultiplier = matchPercentage;
            
            // Bonus for efficiency (fewer attempts, less time)
            if (totalPairs > 0) {
                const efficiency = 1 - (attempts / (totalPairs * 2)); // Ideal is totalPairs * 2 attempts
                xpMultiplier += efficiency * 0.2; // Up to 20% bonus
            }
            
            xpEarned = Math.floor(baseXP_memory * Math.min(1.2, xpMultiplier));
            break;
            
        case 'spin_win':
            // Spin & Win always gives full XP
            // XP comes from the challenge, not the game
            score = 1;
            // If gameData contains challenge XP, use it; otherwise fallback to game XP
            xpEarned = gameData.challengeXp || gameData.xpReward || game.xpReward || 50;
            break;
            
        default:
            throw new Error(`Unknown game type: ${gameType}`);
    }
    
    return {
        score,
        xpEarned: Math.max(0, xpEarned), // Ensure non-negative
        maxScore: gameType === 'quiz_battle' ? (gameData.questions?.length || 0) : 
                  gameType === 'memory_game' ? (gameData.totalPairs || 0) : 1
    };
}

/**
 * Parse Gemini game response
 * @param {string} responseText - Raw response from Gemini
 * @param {string} gameType - Type of game
 * @returns {Object} - Parsed game data
 */
function parseGeminiGameResponse(responseText, gameType) {
    const { parseQuizResponse, parseMemoryGameResponse } = require('../utils/geminiGameGenerator');
    
    switch (gameType) {
        case 'quiz_battle':
            return { questions: parseQuizResponse(responseText) };
        case 'memory_game':
            return { pairs: parseMemoryGameResponse(responseText) };
        default:
            throw new Error(`Unknown game type for parsing: ${gameType}`);
    }
}

/**
 * Accrue daily spins for a user
 * Adds 1 spin per day missed since last accrual date
 * @param {number} userId - User ID
 * @returns {Promise<number>} - Updated available spins count
 */
async function accrueDailySpins(userId) {
    try {
        // Get or create user profile
        let profile = await UserProfile.findOne({ where: { userId } });
        
        if (!profile) {
            // Create profile if it doesn't exist
            profile = await UserProfile.create({
                userId,
                totalXp: 0,
                challengesCompleted: 0,
                workoutsCompleted: 0,
                availableSpins: 1, // Give 1 spin on first creation
                lastSpinAccrualDate: new Date().toISOString().split('T')[0] // Today's date
            });
            return profile.availableSpins;
        }

        // Get today's date in UTC (DATEONLY format: YYYY-MM-DD)
        const today = new Date();
        const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const todayDateStr = todayUTC.toISOString().split('T')[0];

        // If lastSpinAccrualDate is null or before today, accrue spins
        if (!profile.lastSpinAccrualDate || profile.lastSpinAccrualDate < todayDateStr) {
            let daysMissed = 0;
            
            if (profile.lastSpinAccrualDate) {
                // Calculate days missed
                const lastDate = new Date(profile.lastSpinAccrualDate + 'T00:00:00Z');
                const daysDiff = Math.floor((todayUTC - lastDate) / (1000 * 60 * 60 * 24));
                daysMissed = Math.max(0, daysDiff); // Ensure non-negative
            } else {
                // First time - give 1 spin
                daysMissed = 1;
            }

            // Add 1 spin per day missed (unlimited accumulation)
            profile.availableSpins = (profile.availableSpins || 0) + daysMissed;
            profile.lastSpinAccrualDate = todayDateStr;
            await profile.save();
        }

        return profile.availableSpins;
    } catch (error) {
        console.error('Error accruing daily spins:', error);
        throw error;
    }
}

module.exports = {
    spinAndWin,
    generateQuiz,
    generateMemoryGame,
    calculateGameScore,
    parseGeminiGameResponse,
    accrueDailySpins
};

