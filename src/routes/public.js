const express = require('express');
const router = express.Router();
const { ok, err } = require('../utils/errors');
const { Challenge, Trainer, User } = require('../models');

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

// GET /public/trainers - list verified trainers
router.get('/trainers', async (req, res) => {
    try {
        const trainers = await Trainer.findAll({
            where: { verified: true },
            include: [{
                model: User,
                attributes: ['id', 'name', 'profilePicture']
            }],
            order: [['createdAt', 'DESC']]
        });

        // Format response to include user data
        const formattedTrainers = trainers.map(trainer => {
            const trainerData = trainer.toJSON();
            return {
                userId: trainerData.userId,
                name: trainerData.User?.name || 'Unknown',
                profilePicture: trainerData.User?.profilePicture || null,
                specialties: trainerData.specialties || []
            };
        });

        ok(res, { items: formattedTrainers });
    } catch (error) {
        err(res, error);
    }
});

module.exports = router;
