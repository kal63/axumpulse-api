'use strict';

const { Game, Challenge } = require('../models');
const { Op } = require('sequelize');
const { 
    generateQuizWithGemini, 
    generateMemoryGameWithGemini 
} = require('../utils/geminiGameGenerator');

/**
 * Spin & Win - Random challenge selection from challenges with isGameChallenge flag
 * @param {Object} game - Game model instance
 * @returns {Promise<Object>} - Selected challenge with all details
 */
async function spinAndWin(game) {
    try {
        // Filter challenges by isGameChallenge flag
        const whereClause = {
            active: true,
            status: 'approved',
            isPublic: true,
            isDailyChallenge: false,
            isGameChallenge: true // Only challenges marked for games
        };

        // Optionally filter by difficulty if game has one
        if (game.difficulty) {
            whereClause.difficulty = game.difficulty;
        }

        // Optionally filter by type if game config specifies
        const config = game.configJson || {};
        if (config.challengeType) {
            whereClause.type = config.challengeType;
        }

        // Fetch available challenges
        const challenges = await Challenge.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: 100
        });

        if (challenges.length === 0) {
            throw new Error('No challenges available for Spin & Win game. Mark challenges as "Game Challenge" to make them available.');
        }

        // Randomly select a challenge
        const randomIndex = Math.floor(Math.random() * challenges.length);
        const selectedChallenge = challenges[randomIndex];

        // Format challenge to match expected exercise structure
        // Use XP from challenge, not from game
        return {
            title: selectedChallenge.title,
            name: selectedChallenge.title, // For backward compatibility
            description: selectedChallenge.description || null,
            requirements: selectedChallenge.requirements || null,
            difficulty: selectedChallenge.difficulty || 'beginner',
            type: selectedChallenge.type || 'fitness',
            xpReward: selectedChallenge.xpReward || 50, // Use challenge XP
            category: selectedChallenge.type,
            muscleGroup: null,
            muscleGroups: null,
            challengeId: selectedChallenge.id // Include challenge ID for reference
        };
    } catch (error) {
        console.error('Error fetching challenges for Spin & Win:', error);
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

module.exports = {
    spinAndWin,
    generateQuiz,
    generateMemoryGame,
    calculateGameScore,
    parseGeminiGameResponse
};

