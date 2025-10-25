const express = require('express');
const router = express.Router();
const { Trainer, User } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination');
const { Op } = require('sequelize');

// GET /api/v1/admin/trainers?verified=&q=&page=&pageSize=
router.get('/', async (req, res) => {
    try {
        const { verified, q } = req.query;
        const pagination = getPagination(req.query);

        const where = {};
        if (verified !== undefined) {
            where.verified = verified === 'true';
        }

        const userWhere = {};
        if (q) {
            userWhere.phone = { [Op.like]: `%${q}%` };
        }

        const result = await executePaginatedQueryWithSeparateCount(Trainer, {
            where,
            include: [{
                model: User,
                where: userWhere,
                attributes: ['id', 'phone', 'email', 'name', 'profilePicture', 'dateOfBirth', 'gender', 'isAdmin', 'isTrainer', 'status', 'lastLoginAt', 'lastActiveAt', 'createdAt', 'updatedAt']
            }],
            order: [['createdAt', 'DESC']],
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

// Verification endpoints removed - now handled by trainer applications system

module.exports = router;


