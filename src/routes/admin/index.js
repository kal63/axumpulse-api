const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/requireAdmin');
const { actionLogger } = require('../../middleware/actionLogger');
const { ok, err } = require('../../utils/errors');
const { User, UserProfile, Trainer, Challenge, Reward } = require('../../models');

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);
router.use(actionLogger('ADMIN_ACCESS')); // Log all admin actions

// GET /api/v1/admin/stats
router.get('/stats', async (req, res) => {
    try {
        console.log('Getting admin stats...');
        const [users, trainers, challenges, rewards, totalXpResult, challengesCompletedResult, proSubscriptions] = await Promise.all([
            User.count(),
            Trainer.count(),
            Challenge.count(),
            Reward.count(),
            UserProfile.sum('totalXp'),
            UserProfile.sum('challengesCompleted'),
            UserProfile.count({ where: { subscriptionTier: 'pro' } })
        ]);

        // Handle null results from sum() - Sequelize returns null when no records exist
        const totalXp = totalXpResult || 0;
        const challengesCompleted = challengesCompletedResult || 0;

        // Debug: Check UserProfile data
        const profileCount = await UserProfile.count();
        console.log('UserProfile count:', profileCount);
        console.log('Stats calculated:', { users, trainers, challenges, rewards, totalXp, challengesCompleted, proSubscriptions });
        ok(res, { users, trainers, challenges, rewards, totalXp, challengesCompleted, proSubscriptions });
    } catch (error) {
        console.error('Stats error:', error);
        err(res, error);
    }
});

// Mount sub-routers
router.use('/languages', require('./languages'));
router.use('/trainers', require('./trainers'));
router.use('/users', require('./users'));
router.use('/challenges', require('./challenges'));
router.use('/workout-plans', require('./workout-plans'));
router.use('/games', require('./games'));
router.use('/rewards', require('./rewards'));
router.use('/moderation', require('./moderation'));
router.use('/medical-applications', require('./medical-applications'));

module.exports = router;


