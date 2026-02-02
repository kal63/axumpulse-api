'use strict';

const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { Game, UserGameProgress } = require('../../models');
const { Op, literal } = require('sequelize');
const { spinAndWin, generateQuiz, generateMemoryGame, calculateGameScore } = require('../../services/gameService');
const { awardGameXP } = require('../../services/xpService');
const requireAuth = require('../../middleware/auth').requireAuth;

// All routes require authentication
router.use(requireAuth);

/**
 * List available games
 */
router.get('/', async (req, res) => {
    try {
        const { gameType, difficulty, active } = req.query;

        const whereClause = {
            active: active !== 'false' // Default to true
        };

        if (gameType) {
            whereClause.gameType = gameType;
        }

        if (difficulty) {
            whereClause.difficulty = difficulty;
        }

        const games = await Game.findAll({
            where: whereClause,
            order: [['createdAt', 'DESC']]
        });

        ok(res, {
            games: games.map(game => game.toJSON())
        });
    } catch (error) {
        console.error('Error fetching games:', error);
        err(res, error);
    }
});

/**
 * Get user's game history
 * IMPORTANT: This must come BEFORE /:id route to avoid "history" being treated as an ID
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id;
        const { gameType, limit = 20 } = req.query;

        // Build the query
        const queryLimit = limit ? parseInt(limit) : 50;
        if (isNaN(queryLimit) || queryLimit < 1) {
            return err(res, { 
                code: 'VALIDATION_ERROR', 
                message: 'Invalid limit parameter' 
            }, 400);
        }

        let progressList;

        // Get all progress records first - use simplest possible query
        let allProgress = [];
        try {
            console.log(`[Game History] Querying progress records for user ${userId}`);
            
            // Use the simplest WHERE clause possible - just userId
            // We'll filter gameId in JavaScript to avoid any Sequelize SQL generation issues
            allProgress = await UserGameProgress.findAll({
                where: { userId },
                order: [['completedAt', 'DESC'], ['createdAt', 'DESC']],
                limit: queryLimit * 3, // Get more to account for filtering
                include: [], // Explicitly no includes
                raw: true // Get plain objects to avoid Sequelize coercion issues
            });
            
            console.log(`[Game History] Raw query returned ${allProgress.length} records`);
            
            // CRITICAL: Normalize and validate gameId immediately - prevents NaN in SQL
            allProgress = allProgress
                .map(p => {
                    // Convert gameId to number, handling all edge cases
                    let gameId = p.gameId;
                    if (gameId == null || gameId === undefined || gameId === '') {
                        return null; // Mark for filtering
                    }
                    const numId = Number(gameId);
                    if (isNaN(numId) || !isFinite(numId) || numId <= 0 || !Number.isInteger(numId)) {
                        return null; // Mark for filtering
                    }
                    return {
                        ...p,
                        gameId: numId
                    };
                })
                .filter(p => p !== null); // Remove invalid entries
            
            console.log(`[Game History] After normalization: ${allProgress.length} valid progress records`);
        } catch (progressQueryError) {
            console.error('[Game History] Error querying progress records:', progressQueryError);
            console.error('[Game History] Error details:', {
                message: progressQueryError.message,
                sql: progressQueryError.sql,
                stack: progressQueryError.stack
            });
            // Return empty result instead of crashing
            return ok(res, { history: [] });
        }
        
        // All progress records are already normalized and filtered
        progressList = allProgress;
        
        // If filtering by gameType, filter progress records by loading games separately
        if (gameType && progressList.length > 0) {
            // Get unique valid gameIds - already normalized to numbers
            const validGameIds = [...new Set(progressList.map(p => p.gameId))];
            
            // CRITICAL: Guard against empty or invalid arrays before Op.in
            // Double-check every ID is a valid positive integer
            const finalValidGameIds = validGameIds.filter(id => {
                const isValid = typeof id === 'number' && 
                               !isNaN(id) && 
                               isFinite(id) && 
                               id > 0 && 
                               Number.isInteger(id);
                if (!isValid) {
                    console.error(`[Game History] Invalid gameId in array:`, id, typeof id);
                }
                return isValid;
            });
            
            if (!finalValidGameIds.length) {
                console.warn(`[Game History] No valid gameIds after final validation`);
                progressList = [];
            } else {
                console.log(`[Game History] Filtering by gameType ${gameType}, querying ${finalValidGameIds.length} games with IDs:`, finalValidGameIds);
                
                // Load games for these IDs with error handling
                let games = [];
                try {
                    games = await Game.findAll({
                        where: { 
                            id: { [Op.in]: finalValidGameIds },
                            gameType: gameType
                        },
                        attributes: ['id', 'title', 'gameType', 'difficulty'],
                        raw: true // Use raw to avoid any Sequelize issues
                    });
                } catch (gameQueryError) {
                    console.error('[Game History] Error querying games:', gameQueryError);
                    console.error('[Game History] GameIds that caused error:', finalValidGameIds);
                    console.error('[Game History] Error SQL:', gameQueryError.sql);
                    // Return empty result on error
                    return ok(res, { history: [] });
                }
            
                // Handle both raw objects and Sequelize instances
                const gameMap = new Map(games.map(g => {
                    const gameData = typeof g.toJSON === 'function' ? g.toJSON() : g;
                    return [gameData.id, gameData];
                }));
                
                // Filter progress to only those with matching gameType
                progressList = progressList
                    .filter(p => gameMap.has(p.gameId))
                    .map(p => ({ ...p, game: gameMap.get(p.gameId) }))
                    .slice(0, queryLimit);
            }
        } else if (progressList.length > 0) {
            // Load games separately to avoid join issues
            const validGameIds = [...new Set(progressList.map(p => p.gameId))];
            
            // CRITICAL: Guard against empty or invalid arrays before Op.in
            // Double-check every ID is a valid positive integer
            const finalValidGameIds = validGameIds.filter(id => {
                const isValid = typeof id === 'number' && 
                               !isNaN(id) && 
                               isFinite(id) && 
                               id > 0 && 
                               Number.isInteger(id);
                if (!isValid) {
                    console.error(`[Game History] Invalid gameId in array:`, id, typeof id);
                }
                return isValid;
            });
            
            if (!finalValidGameIds.length) {
                console.warn(`[Game History] No valid gameIds after final validation`);
                progressList = progressList.map(p => ({ ...p, game: null })).slice(0, queryLimit);
            } else {
                console.log(`[Game History] Loading games for ${finalValidGameIds.length} gameIds:`, finalValidGameIds);
                
                let games = [];
                try {
                    games = await Game.findAll({
                        where: { id: { [Op.in]: finalValidGameIds } },
                        attributes: ['id', 'title', 'gameType', 'difficulty'],
                        raw: true // Use raw to avoid any Sequelize issues
                    });
                } catch (gameQueryError) {
                    console.error('[Game History] Error querying games:', gameQueryError);
                    console.error('[Game History] GameIds that caused error:', finalValidGameIds);
                    console.error('[Game History] Error SQL:', gameQueryError.sql);
                    // Return empty result on error
                    return ok(res, { history: [] });
                }
                
                // Handle both raw objects and Sequelize instances
                const gameMap = new Map(games.map(g => {
                    const gameData = typeof g.toJSON === 'function' ? g.toJSON() : g;
                    return [gameData.id, gameData];
                }));
                
                // Attach games to progress records
                progressList = progressList
                    .map(p => ({ ...p, game: gameMap.get(p.gameId) || null }))
                    .slice(0, queryLimit);
            }
        }

        // Debug logging
        console.log(`[Game History] Found ${progressList.length} records for user ${userId}`);
        if (progressList.length > 0) {
            const sample = progressList[0];
            console.log('[Game History] Sample record:', {
                id: sample.id,
                userId: sample.userId,
                gameId: sample.gameId,
                gameIdType: typeof sample.gameId,
                score: sample.score,
                hasGame: !!sample.game,
                gameData: sample.gameData
            });
            
            // Check for invalid gameIds
            const invalidGameIds = progressList.filter(p => {
                const gid = p.gameId;
                return gid == null || isNaN(gid) || !Number.isInteger(Number(gid));
            });
            if (invalidGameIds.length > 0) {
                console.warn(`[Game History] Found ${invalidGameIds.length} records with invalid gameId:`, 
                    invalidGameIds.map(p => ({ id: p.id, gameId: p.gameId, gameIdType: typeof p.gameId }))
                );
            }
        }

        // Map to response format - progressList is already plain objects
        const history = progressList.map(progress => {
            // Parse gameData if it's a string (JSON field)
            let gameData = progress.gameData;
            if (typeof gameData === 'string') {
                try {
                    gameData = JSON.parse(gameData);
                } catch (e) {
                    gameData = {};
                }
            }
            
            return {
                id: progress.id,
                userId: progress.userId,
                gameId: progress.gameId,
                score: progress.score || 0,
                xpEarned: progress.xpEarned || 0,
                completedAt: progress.completedAt || progress.createdAt,
                gameData: gameData || {},
                game: progress.game || null
            };
        });

        ok(res, {
            history
        });
    } catch (error) {
        console.error('Error fetching game history:', error);
        err(res, error);
    }
});

/**
 * Get game details
 */
router.get('/:id', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);
        
        // Validate gameId before querying
        if (isNaN(gameId) || gameId <= 0 || !Number.isInteger(gameId)) {
            return err(res, { 
                code: 'VALIDATION_ERROR', 
                message: 'Invalid game ID' 
            }, 400);
        }

        const game = await Game.findByPk(gameId);

        if (!game) {
            return err(res, { 
                code: 'NOT_FOUND', 
                message: 'Game not found' 
            }, 404);
        }

        if (!game.active) {
            return err(res, { 
                code: 'GAME_INACTIVE', 
                message: 'This game is currently inactive' 
            }, 400);
        }

        ok(res, {
            game: game.toJSON()
        });
    } catch (error) {
        console.error('Error fetching game:', error);
        err(res, error);
    }
});

/**
 * Start/play a game
 * Returns game content based on game type
 */
router.post('/:id/play', async (req, res) => {
    try {
        const userId = req.user.id;
        const gameId = parseInt(req.params.id);
        
        // Validate gameId before querying
        if (isNaN(gameId) || gameId <= 0 || !Number.isInteger(gameId)) {
            return err(res, { 
                code: 'VALIDATION_ERROR', 
                message: 'Invalid game ID' 
            }, 400);
        }

        const game = await Game.findByPk(gameId);

        if (!game) {
            return err(res, { 
                code: 'NOT_FOUND', 
                message: 'Game not found' 
            }, 404);
        }

        if (!game.active) {
            return err(res, { 
                code: 'GAME_INACTIVE', 
                message: 'This game is currently inactive' 
            }, 400);
        }

        let gameContent = {};
        let sessionId = null;

        switch (game.gameType) {
            case 'spin_win':
                // Get wheel challenges from request body if provided
                const wheelChallenges = req.body.wheelChallenges || null;
                // Get recent selections from request body to avoid immediate repeats
                const recentSelections = req.body.recentSelections || [];
                
                const exercise = await spinAndWin(game, wheelChallenges, recentSelections);
                gameContent = { 
                    exercise,
                    challengeXp: exercise.xpReward // Pass challenge XP for use in submit
                };
                break;

            case 'quiz_battle':
                const quizResult = await generateQuiz(game, true);
                gameContent = {
                    questions: quizResult.questions,
                    cached: quizResult.cached
                };
                break;

            case 'memory_game':
                const memoryResult = await generateMemoryGame(game, true);
                gameContent = {
                    pairs: memoryResult.pairs,
                    cached: memoryResult.cached
                };
                break;

            default:
                return err(res, { 
                    code: 'INVALID_GAME_TYPE', 
                    message: `Unknown game type: ${game.gameType}` 
                }, 400);
        }

        // Generate session ID (simple timestamp-based)
        sessionId = `game_${gameId}_${userId}_${Date.now()}`;

        ok(res, {
            gameId: game.id,
            gameType: game.gameType,
            sessionId,
            content: gameContent,
            xpReward: game.xpReward
        });
    } catch (error) {
        console.error('Error starting game:', error);
        err(res, error);
    }
});

/**
 * Submit game results
 */
router.post('/:id/submit', async (req, res) => {
    try {
        const userId = req.user.id;
        const gameId = parseInt(req.params.id);
        const { gameData, sessionId } = req.body;

        // Validate gameId before querying
        if (isNaN(gameId) || gameId <= 0 || !Number.isInteger(gameId)) {
            return err(res, { 
                code: 'VALIDATION_ERROR', 
                message: 'Invalid game ID' 
            }, 400);
        }

        if (!gameData) {
            return err(res, { 
                code: 'VALIDATION_ERROR', 
                message: 'gameData is required' 
            }, 400);
        }

        const game = await Game.findByPk(gameId);

        if (!game) {
            return err(res, { 
                code: 'NOT_FOUND', 
                message: 'Game not found' 
            }, 404);
        }

        // Calculate score and XP
        // For spin_win, if challengeXp is provided in gameData, use it instead of game.xpReward
        let xpToAward = game.xpReward || 50
        if (game.gameType === 'spin_win' && gameData.challengeXp) {
            xpToAward = gameData.challengeXp
        }
        
        // Create a modified game object with challenge XP for score calculation
        const gameForScore = { ...game.toJSON(), xpReward: xpToAward }
        const scoreResult = calculateGameScore(game.gameType, gameData, gameForScore);

        // Award XP (use challenge XP if available for spin_win)
        const xpResult = await awardGameXP(
            userId,
            scoreResult.xpEarned,
            gameId,
            game.gameType
        );

        // Always create a new progress record for history tracking
        const progress = await UserGameProgress.create({
            userId,
            gameId,
            score: scoreResult.score,
            xpEarned: scoreResult.xpEarned,
            completedAt: new Date(),
            gameData: gameData
        });

        ok(res, {
            message: 'Game completed!',
            score: scoreResult.score,
            maxScore: scoreResult.maxScore,
            xpEarned: scoreResult.xpEarned,
            totalXP: xpResult.xp,
            level: xpResult.level,
            leveledUp: xpResult.leveledUp,
            progress: progress.toJSON()
        });
    } catch (error) {
        console.error('Error submitting game results:', error);
        err(res, error);
    }
});

module.exports = { router };
