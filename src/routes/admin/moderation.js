const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination');
const { Content, Challenge, Trainer, User, WorkoutPlan, WorkoutExercise } = require('../../models');
const { Op } = require('sequelize');

// GET /api/v1/admin/moderation?kind=&status=&lang=&q=&page=&pageSize=
router.get('/', async (req, res) => {
    try {
        const { page, pageSize, limit, offset } = getPagination(req.query);
        const { kind, status, lang, q } = req.query;

        let items = [];
        let total = 0;

        if (kind === 'content') {
            // Get trainer content for moderation
            const whereClause = {
                status: status || 'pending'
            };

            if (lang) {
                whereClause.language = lang;
            }

            if (q) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ];
            }

            const result = await executePaginatedQueryWithSeparateCount(Content, {
                where: whereClause,
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            }, { page, pageSize, limit, offset });

            return ok(res, {
                ...result,
                filters: { kind, status, lang, q }
            });
        } else if (kind === 'challenge') {
            // Get trainer challenges for moderation
            const whereClause = {
                status: status || 'pending',
                isTrainerCreated: true
            };

            if (lang) {
                whereClause.language = lang;
            }

            if (q) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ];
            }

            const result = await executePaginatedQueryWithSeparateCount(Challenge, {
                where: whereClause,
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            }, { page, pageSize, limit, offset });

            return ok(res, {
                ...result,
                filters: { kind, status, lang, q }
            });
        } else if (kind === 'workout-plan') {
            // Get trainer workout plans for moderation
            const whereClause = {
                status: status || 'pending'
            };

            if (q) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { description: { [Op.like]: `%${q}%` } }
                ];
            }

            const result = await executePaginatedQueryWithSeparateCount(WorkoutPlan, {
                where: whereClause,
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        attributes: ['userId', 'bio', 'specialties', 'verified'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'email', 'phone']
                            }
                        ]
                    },
                    {
                        model: WorkoutExercise,
                        as: 'exercises'
                    }
                ],
                order: [['createdAt', 'DESC']]
            }, { page, pageSize, limit, offset });

            // Sort exercises by order for each workout plan
            result.items.forEach(plan => {
                if (plan.exercises) {
                    plan.exercises.sort((a, b) => a.order - b.order);
                }
            });

            return ok(res, {
                ...result,
                filters: { kind, status, q }
            });
        }

        // If no kind specified, return empty result
        ok(res, {
            items: [],
            pagination: {
                page,
                pageSize,
                totalItems: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            },
            filters: { kind, status, lang, q }
        });
    } catch (error) {
        err(res, error);
    }
});

// GET /api/v1/admin/moderation/:kind/:id
router.get('/:kind/:id', async (req, res) => {
    try {
        const { kind, id } = req.params;
        let item = null;

        if (kind === 'content') {
            item = await Content.findByPk(id, {
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ]
            });
        } else if (kind === 'challenge') {
            item = await Challenge.findByPk(id, {
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        include: [
                            {
                                model: User,
                                as: 'User',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ]
            });
        } else if (kind === 'workout-plan') {
            item = await WorkoutPlan.findByPk(id, {
                include: [
                    {
                        model: Trainer,
                        as: 'trainer',
                        attributes: ['userId', 'bio', 'specialties', 'verified'],
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'name', 'email', 'phone']
                            }
                        ]
                    },
                    {
                        model: WorkoutExercise,
                        as: 'exercises'
                    }
                ]
            });

            // Sort exercises by order
            if (item && item.exercises) {
                item.exercises.sort((a, b) => a.order - b.order);
            }
        }

        if (!item) {
            return err(res, { code: 'NOT_FOUND', message: `${kind} not found` }, 404);
        }

        ok(res, {
            item,
            kind,
            id: parseInt(id)
        });
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/moderation/:kind/:id/approve
router.post('/:kind/:id/approve', async (req, res) => {
    try {
        const { kind, id } = req.params;
        let item = null;

        if (kind === 'content') {
            item = await Content.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404);
            }

            await item.update({
                status: 'approved',
                rejectionReason: null
            });
        } else if (kind === 'challenge') {
            item = await Challenge.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404);
            }

            await item.update({
                status: 'approved',
                rejectionReason: null
            });
        } else if (kind === 'workout-plan') {
            item = await WorkoutPlan.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404);
            }

            await item.update({
                status: 'approved',
                rejectionReason: null,
                rejectedBy: null,
                rejectedAt: null,
                approvedBy: req.user?.id,
                approvedAt: new Date()
            });
        } else {
            return err(res, { code: 'INVALID_KIND', message: 'Invalid kind. Must be content, challenge, or workout-plan' }, 400);
        }

        ok(res, {
            approved: true,
            kind,
            id: parseInt(id),
            item
        });
    } catch (error) {
        err(res, error);
    }
});

// POST /api/v1/admin/moderation/:kind/:id/reject
router.post('/:kind/:id/reject', async (req, res) => {
    try {
        const { kind, id } = req.params;
        const { reason } = req.body;
        let item = null;

        if (!reason) {
            return err(res, { code: 'MISSING_REASON', message: 'Rejection reason is required' }, 400);
        }

        if (kind === 'content') {
            item = await Content.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Content not found' }, 404);
            }

            await item.update({
                status: 'rejected',
                rejectionReason: reason
            });
        } else if (kind === 'challenge') {
            item = await Challenge.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Challenge not found' }, 404);
            }

            await item.update({
                status: 'rejected',
                rejectionReason: reason
            });
        } else if (kind === 'workout-plan') {
            item = await WorkoutPlan.findByPk(id);
            if (!item) {
                return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404);
            }

            await item.update({
                status: 'rejected',
                rejectionReason: reason,
                approvedBy: null,
                approvedAt: null,
                rejectedBy: req.user?.id,
                rejectedAt: new Date()
            });
        } else {
            return err(res, { code: 'INVALID_KIND', message: 'Invalid kind. Must be content, challenge, or workout-plan' }, 400);
        }

        ok(res, {
            rejected: true,
            kind,
            id: parseInt(id),
            reason,
            item
        });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;



