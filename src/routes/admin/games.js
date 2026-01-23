'use strict';

const express = require('express');
const router = express.Router();
const { Game, UserGameProgress } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');
const { Op } = require('sequelize');

// GET /api/v1/admin/games
router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const { gameType, active, search } = req.query;

        const where = {};
        
        if (gameType && gameType !== 'all') {
            where.gameType = gameType;
        }
        
        if (active !== undefined && active !== 'all') {
            where.active = active === 'true';
        }
        
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        const result = await executePaginatedQuery(Game, {
            where,
            order: [['createdAt', 'DESC']],
        }, pagination);

        ok(res, result);
    } catch (error) {
        console.error('Error fetching games:', error);
        err(res, error);
    }
});

// GET /api/v1/admin/games/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByPk(id);
        
        if (!game) {
            return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404);
        }

        // Get game statistics
        const stats = await UserGameProgress.findAll({
            where: { gameId: id },
            attributes: [
                [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'totalPlays'],
                [require('sequelize').fn('SUM', require('sequelize').col('xpEarned')), 'totalXpAwarded'],
                [require('sequelize').fn('AVG', require('sequelize').col('score')), 'averageScore']
            ],
            raw: true
        });

        const gameData = game.toJSON();
        
        // Parse JSON fields if they're strings
        if (typeof gameData.configJson === 'string') {
            try {
                gameData.configJson = JSON.parse(gameData.configJson);
            } catch (e) {
                gameData.configJson = {};
            }
        }
        
        if (typeof gameData.cachedContent === 'string') {
            try {
                gameData.cachedContent = JSON.parse(gameData.cachedContent);
            } catch (e) {
                gameData.cachedContent = null;
            }
        }

        ok(res, {
            game: gameData,
            stats: stats[0] || { totalPlays: 0, totalXpAwarded: 0, averageScore: 0 }
        });
    } catch (error) {
        console.error('Error fetching game:', error);
        err(res, error);
    }
});

// POST /api/v1/admin/games
router.post('/', async (req, res) => {
    try {
        const payload = req.body || {};
        
        // Ensure configJson is properly formatted
        if (payload.configJson && typeof payload.configJson === 'object') {
            payload.configJson = JSON.stringify(payload.configJson);
        }
        
        const created = await Game.create(payload);
        ok(res, { game: created.toJSON() });
    } catch (error) {
        console.error('Error creating game:', error);
        err(res, error);
    }
});

// PUT /api/v1/admin/games/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByPk(id);
        
        if (!game) {
            return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404);
        }

        const payload = req.body || {};
        
        // Handle configJson if it's an object
        if (payload.configJson && typeof payload.configJson === 'object') {
            payload.configJson = JSON.stringify(payload.configJson);
        }
        
        await game.update(payload);
        ok(res, { game: game.toJSON() });
    } catch (error) {
        console.error('Error updating game:', error);
        err(res, error);
    }
});

// DELETE /api/v1/admin/games/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByPk(id);
        
        if (!game) {
            return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404);
        }

        await game.destroy();
        ok(res, { deleted: true });
    } catch (error) {
        console.error('Error deleting game:', error);
        err(res, error);
    }
});

// POST /api/v1/admin/games/:id/clear-cache
router.post('/:id/clear-cache', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByPk(id);
        
        if (!game) {
            return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404);
        }

        await game.update({
            cachedContent: null,
            cacheExpiresAt: null
        });
        
        ok(res, { 
            message: 'Cache cleared successfully',
            game: game.toJSON()
        });
    } catch (error) {
        console.error('Error clearing cache:', error);
        err(res, error);
    }
});

// POST /api/v1/admin/games/:id/regenerate-cache
router.post('/:id/regenerate-cache', async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findByPk(id);
        
        if (!game) {
            return err(res, { code: 'NOT_FOUND', message: 'Game not found' }, 404);
        }

        if (!game.useAiGeneration) {
            return err(res, { 
                code: 'INVALID_OPERATION', 
                message: 'Game does not use AI generation' 
            }, 400);
        }

        // Import game service to regenerate content
        const { generateGameContent } = require('../../services/gameService');
        
        // Clear existing cache first
        await game.update({
            cachedContent: null,
            cacheExpiresAt: null
        });
        
        // Regenerate content
        const newContent = await generateGameContent(game);
        
        // Update cache
        const cacheExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await game.update({
            cachedContent: newContent,
            cacheExpiresAt: cacheExpiresAt
        });
        
        const updatedGame = await Game.findByPk(id);
        
        ok(res, { 
            message: 'Cache regenerated successfully',
            game: updatedGame.toJSON()
        });
    } catch (error) {
        console.error('Error regenerating cache:', error);
        err(res, error);
    }
});

module.exports = router;

