const express = require('express');
const router = express.Router();
const { User, UserProfile } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination');
const { Op } = require('sequelize');

// GET /api/v1/admin/users?q=&status=&page=&pageSize=
router.get('/', async (req, res) => {
    try {
        const { q, status } = req.query;
        const pagination = getPagination(req.query);

        const where = {};
        if (q) {
            where.phone = { [Op.like]: `%${q}%` };
        }
        if (status) {
            where.status = status;
        }

        const result = await executePaginatedQueryWithSeparateCount(User, {
            where,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: UserProfile,
                    as: 'profile',
                    required: false // LEFT JOIN - include users even without profiles
                }
            ]
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/users/:id/admin
router.post('/:id/admin', async (req, res) => {
    try {
        const { id } = req.params;
        const { isAdmin } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }

        user.isAdmin = isAdmin;
        await user.save();

        ok(res, { user });
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/users/:id/status
router.post('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' | 'blocked'

        if (!['active', 'blocked'].includes(status)) {
            return err(res, { code: 'VALIDATION_ERROR', message: 'Invalid status provided' }, 400);
        }

        const user = await User.findByPk(id);
        if (!user) {
            return err(res, { code: 'NOT_FOUND', message: 'User not found' }, 404);
        }

        user.status = status;
        await user.save();

        ok(res, { user });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;


