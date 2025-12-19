const express = require('express');
const router = express.Router();
const { ok, err } = require('../utils/errors');
const { Challenge } = require('../models');

// Public root
router.get('/', (req, res) => ok(res, { message: 'Public API root' }));

// GET /public/challenges - list public, active challenges
router.get('/challenges', async (req, res) => {
    try {
        const challenges = await Challenge.findAll({ where: { isPublic: true, status: 'active' } });
        ok(res, { items: challenges });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;
