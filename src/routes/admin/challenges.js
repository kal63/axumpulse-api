const express = require('express');
const router = express.Router();
const { Challenge } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');

// GET /api/v1/admin/challenges
router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        const result = await executePaginatedQuery(Challenge, {
            order: [['createdAt', 'DESC']],
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/challenges
router.post('/', async (req, res) => {
    try {
        const { Challenge } = require('../../models');
        const payload = req.body || {};
        const created = await Challenge.create({
            ...payload,
            createdBy: req.user?.id || null
        });
        ok(res, { challenge: created });
    } catch (error) {
        err(res, error);
    }
});

// PUT /api/v1/admin/challenges/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await Challenge.findByPk(id);
        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404);
        }

        await challenge.update(req.body || {});
        ok(res, { challenge });
    } catch (error) {
        err(res, error);
    }
});

// DELETE /api/v1/admin/challenges/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await Challenge.findByPk(id);
        if (!challenge) {
            return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404);
        }

        await challenge.destroy();
        ok(res, { deleted: true });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;


