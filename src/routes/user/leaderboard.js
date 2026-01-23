'use strict';

const express = require('express');
const router = express.Router();
const { ok, err } = require('../../utils/errors');
const { User, UserProfile } = require('../../models');
const { Op } = require('sequelize');
const { calculateLevel } = require('../../services/xpService');
const requireAuth = require('../../middleware/auth').requireAuth;

// All routes require authentication
router.use(requireAuth);

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Get age group from age
 */
function getAgeGroup(age) {
    if (!age) return null;
    if (age < 18) return 'under_18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
}

/**
 * Get global leaderboard
 * Query params: filterBy (city, ageGroup, friends), period (weekly, monthly, all-time), limit, offset
 */
router.get('/global', async (req, res) => {
    try {
        const userId = req.user.id;
        const { filterBy, period = 'all-time', limit = 50, offset = 0 } = req.query;

        // Get all user profiles with users
        const profiles = await UserProfile.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'dateOfBirth']
            }],
            order: [['totalXp', 'DESC']],
            limit: parseInt(limit) + 100, // Get more to filter, then limit
            offset: parseInt(offset)
        });

        // Filter and process
        let filteredProfiles = profiles;

        // Filter by city (stored in preferences.location or fitnessGoals.city)
        if (filterBy === 'city') {
            const currentUser = await User.findByPk(userId, {
                include: [{ model: UserProfile, as: 'profile' }]
            });
            const userCity = currentUser?.profile?.preferences?.location || 
                           currentUser?.profile?.fitnessGoals?.city || null;

            if (userCity) {
                filteredProfiles = profiles.filter(profile => {
                    const city = profile.preferences?.location || profile.fitnessGoals?.city;
                    return city === userCity;
                });
            }
        }

        // Filter by age group
        if (filterBy === 'ageGroup') {
            const currentUser = await User.findByPk(userId, {
                attributes: ['dateOfBirth']
            });
            const userAge = calculateAge(currentUser?.dateOfBirth);
            const userAgeGroup = getAgeGroup(userAge);

            if (userAgeGroup) {
                filteredProfiles = profiles.filter(profile => {
                    const age = calculateAge(profile.user?.dateOfBirth);
                    const ageGroup = getAgeGroup(age);
                    return ageGroup === userAgeGroup;
                });
            }
        }

        // Filter by period (for now, we use all-time XP, but this can be enhanced)
        // Period filtering would require tracking XP changes over time
        // For now, we'll just return all-time leaderboard

        // Calculate ranks and format
        const leaderboard = filteredProfiles
            .slice(0, parseInt(limit))
            .map((profile, index) => {
                const user = profile.user;
                const age = calculateAge(user?.dateOfBirth);
                const ageGroup = getAgeGroup(age);
                const city = profile.preferences?.location || profile.fitnessGoals?.city || null;

                return {
                    rank: parseInt(offset) + index + 1,
                    userId: profile.userId,
                    name: user?.name || 'Anonymous',
                    profilePicture: user?.profilePicture,
                    xp: profile.totalXp || 0,
                    level: calculateLevel(profile.totalXp || 0),
                    challengesCompleted: profile.challengesCompleted || 0,
                    workoutsCompleted: profile.workoutsCompleted || 0,
                    streak: profile.dailyChallengeStreak || 0,
                    city,
                    ageGroup
                };
            });

        // Get current user's rank
        const currentUserProfile = await UserProfile.findOne({ where: { userId } });
        let userRank = null;
        if (currentUserProfile) {
            const higherRanked = filteredProfiles.filter(p => 
                (p.totalXp || 0) > (currentUserProfile.totalXp || 0)
            ).length;
            userRank = higherRanked + 1;
        }

        ok(res, {
            leaderboard,
            userRank,
            totalUsers: filteredProfiles.length,
            period,
            filterBy: filterBy || 'none'
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        err(res, error);
    }
});

/**
 * Get current user's rank and surrounding users
 */
router.get('/my-rank', async (req, res) => {
    try {
        const userId = req.user.id;
        const { filterBy, period = 'all-time' } = req.query;

        // Get user profile
        const userProfile = await UserProfile.findOne({
            where: { userId },
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'dateOfBirth']
            }]
        });

        if (!userProfile) {
            return err(res, { 
                code: 'NOT_FOUND', 
                message: 'User profile not found' 
            }, 404);
        }

        // Get all profiles for ranking
        const allProfiles = await UserProfile.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'profilePicture', 'dateOfBirth']
            }],
            order: [['totalXp', 'DESC']]
        });

        // Apply filters if needed
        let filteredProfiles = allProfiles;
        
        if (filterBy === 'city') {
            const userCity = userProfile.preferences?.location || userProfile.fitnessGoals?.city;
            if (userCity) {
                filteredProfiles = allProfiles.filter(profile => {
                    const city = profile.preferences?.location || profile.fitnessGoals?.city;
                    return city === userCity;
                });
            }
        }

        if (filterBy === 'ageGroup') {
            const userAge = calculateAge(userProfile.user?.dateOfBirth);
            const userAgeGroup = getAgeGroup(userAge);
            if (userAgeGroup) {
                filteredProfiles = allProfiles.filter(profile => {
                    const age = calculateAge(profile.user?.dateOfBirth);
                    const ageGroup = getAgeGroup(age);
                    return ageGroup === userAgeGroup;
                });
            }
        }

        // Find user's rank
        const userXP = userProfile.totalXp || 0;
        const higherRanked = filteredProfiles.filter(p => (p.totalXp || 0) > userXP).length;
        const userRank = higherRanked + 1;

        // Get surrounding users (5 above, 5 below)
        const startIndex = Math.max(0, userRank - 6);
        const endIndex = Math.min(filteredProfiles.length, userRank + 5);
        const surrounding = filteredProfiles.slice(startIndex, endIndex);

        const leaderboard = surrounding.map((profile, index) => {
            const age = calculateAge(profile.user?.dateOfBirth);
            const ageGroup = getAgeGroup(age);
            const city = profile.preferences?.location || profile.fitnessGoals?.city || null;

            return {
                rank: startIndex + index + 1,
                userId: profile.userId,
                name: profile.user?.name || 'Anonymous',
                profilePicture: profile.user?.profilePicture,
                xp: profile.totalXp || 0,
                level: calculateLevel(profile.totalXp || 0),
                isCurrentUser: profile.userId === userId,
                city,
                ageGroup
            };
        });

        ok(res, {
            userRank,
            userXP,
            userLevel: calculateLevel(userXP),
            leaderboard,
            totalUsers: filteredProfiles.length,
            period,
            filterBy: filterBy || 'none'
        });
    } catch (error) {
        console.error('Error fetching user rank:', error);
        err(res, error);
    }
});

/**
 * Get leaderboard reward information
 */
router.get('/rewards', async (req, res) => {
    try {
        // This endpoint can return information about leaderboard rewards
        // For now, return placeholder structure
        ok(res, {
            weekly: {
                top1: { type: 'mobile_data', amount: '1GB', description: '1GB mobile data' },
                top2: { type: 'airtime', amount: '100 ETB', description: '100 ETB airtime' },
                top3: { type: 'branded_gear', description: 'Branded fitness gear' }
            },
            monthly: {
                top1: { type: 'mobile_data', amount: '5GB', description: '5GB mobile data' },
                top2: { type: 'airtime', amount: '500 ETB', description: '500 ETB airtime' },
                top3: { type: 'branded_gear', description: 'Premium branded fitness gear' }
            },
            note: 'Rewards are distributed at the end of each period. Winners are notified via app notification.'
        });
    } catch (error) {
        console.error('Error fetching rewards info:', error);
        err(res, error);
    }
});

module.exports = { router };

