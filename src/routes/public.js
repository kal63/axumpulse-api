const express = require('express');
const router = express.Router();
const { ok, err } = require('../utils/errors');
const { Challenge, Trainer, User, TrainerApplication, CertificationFile, TrainerSite } = require('../models');

// Public root
router.get('/', (req, res) => ok(res, { message: 'Public API root' }));

// GET /public/client-config — non-secret flags for web/mobile (e.g. whether dev quick-login is allowed)
router.get('/client-config', (req, res) => {
    ok(res, {
        devLoginEnabled: process.env.ENABLE_DEV_LOGIN === 'true',
    });
});

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

        // Format response to include user data and slug
        const formattedTrainers = trainers.map(trainer => {
            const trainerData = trainer.toJSON();
            const name = trainerData.User?.name || 'Unknown';
            // Create slug from name
            let slug = name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
            
            // Fallback to userId if slug is empty
            if (!slug || slug.length === 0) {
                slug = `trainer-${trainerData.userId}`;
            } else {
                // Append userId to make slug unique and easier to match
                slug = `${slug}-${trainerData.userId}`;
            }
            
            return {
                userId: trainerData.userId,
                name: name,
                slug: slug,
                profilePicture: trainerData.User?.profilePicture || null,
                specialties: trainerData.specialties || []
            };
        });

        ok(res, { items: formattedTrainers });
    } catch (error) {
        err(res, error);
    }
});

// GET /public/trainers/:slug - get detailed trainer information by slug (name) or userId
router.get('/trainers/:slug', async (req, res) => {
    try {
        // Decode the slug in case it was URL encoded
        let slug = decodeURIComponent(req.params.slug);
        console.log(`[Public API] Looking up trainer with slug: "${slug}" (raw: "${req.params.slug}")`);
        let userId = parseInt(slug);
        let trainer = null;

        // Try to find by userId first (for backward compatibility)
        if (!isNaN(userId)) {
            console.log(`[Public API] Trying to find by userId: ${userId}`);
            trainer = await Trainer.findOne({
                where: { 
                    userId: userId,
                    verified: true 
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'name', 'email', 'profilePicture', 'phone', 'dateOfBirth', 'gender']
                    }
                ]
            });
            if (trainer) {
                console.log(`[Public API] Found trainer by userId: ${userId}`);
            }
        }

        // If not found by userId, try to find by name (slug)
        if (!trainer) {
            console.log(`[Public API] Searching by slug, fetching all verified trainers...`);
            const normalizedSlug = slug.replace(/\/$/, '').toLowerCase();
            console.log(`[Public API] Normalized slug: "${normalizedSlug}"`);
            
            // Try to extract userId from slug if it ends with a number (e.g., "kebede-abebe-15" -> 15)
            const slugParts = normalizedSlug.split('-');
            const lastPart = slugParts[slugParts.length - 1];
            const possibleUserId = parseInt(lastPart);
            
            if (!isNaN(possibleUserId)) {
                console.log(`[Public API] Extracted possible userId from slug: ${possibleUserId}`);
                // Try to find by userId first
                trainer = await Trainer.findOne({
                    where: { 
                        userId: possibleUserId,
                        verified: true 
                    },
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'email', 'profilePicture', 'phone', 'dateOfBirth', 'gender']
                        }
                    ]
                });
                
                if (trainer) {
                    const trainerData = trainer.toJSON();
                    const name = trainerData.User?.name || 'Unknown';
                    // Verify the slug matches
                    let baseSlug = name
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_]+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    
                    if (!baseSlug || baseSlug.length === 0) {
                        baseSlug = `trainer`;
                    }
                    
                    const expectedSlug = `${baseSlug}-${possibleUserId}`.toLowerCase();
                    const baseSlugLower = baseSlug.toLowerCase();
                    
                    // Match if slug matches with or without userId
                    if (expectedSlug === normalizedSlug || baseSlugLower === normalizedSlug) {
                        console.log(`[Public API] ✓ Match found by userId extraction! Trainer: ${name} (userId: ${possibleUserId})`);
                    } else {
                        console.log(`[Public API] ✗ Slug doesn't match for userId ${possibleUserId}. Expected: "${expectedSlug}" or "${baseSlugLower}", got: "${normalizedSlug}"`);
                        trainer = null; // Reset if slug doesn't match
                    }
                }
            }
            
            // If still not found, search all trainers
            if (!trainer) {
                const allTrainers = await Trainer.findAll({
                    where: { verified: true },
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'name', 'email', 'profilePicture', 'phone', 'dateOfBirth', 'gender']
                        }
                    ]
                });

                console.log(`[Public API] Found ${allTrainers.length} verified trainers, searching by name...`);

                // Find trainer whose slug matches
                for (const t of allTrainers) {
                    const trainerData = t.toJSON();
                    const name = trainerData.User?.name || 'Unknown';
                    
                    // Generate base slug from name
                    let baseSlug = name
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_]+/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-+|-+$/g, '');
                    
                    // Fallback to userId if slug is empty
                    if (!baseSlug || baseSlug.length === 0) {
                        baseSlug = `trainer`;
                    }
                    
                    // Generate slug with userId (same as list endpoint)
                    const generatedSlug = `${baseSlug}-${trainerData.userId}`;
                    const normalizedGenerated = generatedSlug.toLowerCase();
                    
                    console.log(`[Public API] Trainer "${name}" -> baseSlug: "${baseSlug}", fullSlug: "${generatedSlug}"`);
                    
                    // Match either the full slug (with userId) or just the base slug (for backward compatibility)
                    if (normalizedGenerated === normalizedSlug || baseSlug.toLowerCase() === normalizedSlug) {
                        console.log(`[Public API] ✓ Match found! Trainer: ${name} (userId: ${trainerData.userId})`);
                        trainer = t;
                        break;
                    }
                }
                
                if (!trainer) {
                    console.log(`[Public API] ✗ No trainer found matching slug: "${normalizedSlug}"`);
                }
            }
        }

        if (!trainer) {
            console.log(`[Public API] ✗ Final check: No trainer found for slug: "${slug}"`);
            return err(res, { 
                code: 'TRAINER_NOT_FOUND', 
                message: `Trainer not found with slug: "${slug}". Please verify the slug is correct.` 
            }, 404);
        }
        
        console.log(`[Public API] ✓ Successfully found trainer, proceeding to fetch details...`);

        const trainerData = trainer.toJSON();
        userId = trainerData.userId;

        // Find trainer application to get additional details and certifications
        const application = await TrainerApplication.findOne({
            where: { userId: userId },
            include: [
                {
                    model: CertificationFile,
                    as: 'certificationFiles',
                    attributes: ['id', 'fileName', 'fileUrl', 'fileType', 'fileSize', 'createdAt']
                }
            ],
            order: [['createdAt', 'DESC']] // Get most recent application
        });

        // Find trainer site (only if published)
        const trainerSite = await TrainerSite.findOne({
            where: { 
                userId: userId,
                status: 'published'
            }
        });

        // Format response
        const response = {
            userId: trainerData.userId,
            user: {
                id: trainerData.User?.id,
                name: trainerData.User?.name || 'Unknown',
                email: trainerData.User?.email,
                profilePicture: trainerData.User?.profilePicture,
                phone: trainerData.User?.phone,
                dateOfBirth: trainerData.User?.dateOfBirth,
                gender: trainerData.User?.gender
            },
            trainer: {
                bio: trainerData.bio,
                specialties: trainerData.specialties || [],
                verified: trainerData.verified,
                verifiedAt: trainerData.verifiedAt
            },
            application: application ? {
                yearsOfExperience: application.yearsOfExperience,
                languages: application.languages || [],
                certifications: application.certifications || [],
                portfolio: application.portfolio || [],
                socialMedia: application.socialMedia || {},
                preferences: application.preferences || {},
                certificationFiles: application.certificationFiles || []
            } : null,
            site: trainerSite ? {
                slug: trainerSite.slug,
                headline: trainerSite.headline,
                subheadline: trainerSite.subheadline,
                bio: trainerSite.bio,
                philosophy: trainerSite.philosophy,
                targetAudience: trainerSite.targetAudience,
                heroBackgroundImage: trainerSite.heroBackgroundImage,
                galleryImages: trainerSite.galleryImages || [],
                theme: trainerSite.theme || {},
                sections: trainerSite.sections || [],
                trainerContent: trainerSite.trainerContent || [],
                socialLinks: trainerSite.socialLinks || {},
                ctaText: trainerSite.ctaText
            } : null
        };

        ok(res, response);
    } catch (error) {
        console.error('Error fetching trainer details:', error);
        err(res, error);
    }
});

// GET /public/languages - Get all active languages
router.get('/languages', async (req, res) => {
    try {
        const { Language } = require('../models');
        const languages = await Language.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']]
        });
        ok(res, languages);
    } catch (error) {
        console.error('Error fetching languages:', error);
        err(res, error);
    }
});

module.exports = router;
