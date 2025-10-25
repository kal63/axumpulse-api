const express = require('express');
const router = express.Router();
const { Reward } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');

// GET /api/v1/admin/rewards
router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        const result = await executePaginatedQuery(Reward, {
            order: [['createdAt', 'DESC']],
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/rewards
router.post('/', async (req, res) => {
    try {
        const payload = req.body || {};
        const created = await Reward.create(payload);
        ok(res, { reward: created });
    } catch (error) {
        err(res, error);
    }
});

// PUT /api/v1/admin/rewards/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findByPk(id);
        if (!reward) {
            return err(res, { code: 'NOT_FOUND', message: 'Reward not found' }, 404);
        }

        await reward.update(req.body || {});
        ok(res, { reward });
    } catch (error) {
        err(res, error);
    }
});

// DELETE /api/v1/admin/rewards/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findByPk(id);
        if (!reward) {
            return err(res, { code: 'NOT_FOUND', message: 'Reward not found' }, 404);
        }

        await reward.destroy();
        ok(res, { deleted: true });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;


