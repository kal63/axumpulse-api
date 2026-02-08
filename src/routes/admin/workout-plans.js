const express = require('express');
const router = express.Router();
const { WorkoutPlan } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQuery } = require('../../utils/pagination');

// GET /api/v1/admin/workout-plans
router.get('/', async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        const result = await executePaginatedQuery(WorkoutPlan, {
            order: [['createdAt', 'DESC']],
        }, pagination);

        ok(res, result);
    } catch (error) {
        err(res, error);
    }
});

// PUT /api/v1/admin/workout-plans/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const workoutPlan = await WorkoutPlan.findByPk(id);
        if (!workoutPlan) {
            return err(res, { code: 'NOT_FOUND', message: 'Workout plan not found' }, 404);
        }

        await workoutPlan.update(req.body || {});
        ok(res, { workoutPlan });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;

