'use strict';

const express = require('express');
const router = express.Router();
const { TrainerApplication, CertificationFile, User, Trainer } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { requireAuth } = require('../../middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Apply authentication middleware - ALL routes require auth
router.use(requireAuth);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/applications');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `application_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, JPEG, and PNG files are allowed.'), false);
        }
    }
});

// POST /api/v1/trainer/apply - Submit new application (AUTHENTICATED)
router.post('/', upload.array('certifications', 10), async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return err(res, {
                code: 'UNAUTHORIZED',
                message: 'User not authenticated'
            }, 401);
        }

        // Check if user is already a trainer
        const existingTrainer = await Trainer.findOne({
            where: { userId }
        });

        if (existingTrainer) {
            return err(res, {
                code: 'ALREADY_TRAINER',
                message: 'You are already a trainer'
            }, 400);
        }

        // Check if user already has an application
        const existingApplication = await TrainerApplication.findOne({
            where: { userId }
        });

        if (existingApplication) {
            return err(res, {
                code: 'APPLICATION_EXISTS',
                message: 'You already have an application. Please check your application status.'
            }, 400);
        }

        // Get user data (for validation - we don't store this, just verify user exists)
        const user = await User.findByPk(userId);
        if (!user) {
            return err(res, {
                code: 'USER_NOT_FOUND',
                message: 'User not found'
            }, 404);
        }

        // Parse JSON fields
        let parsedSpecialties, parsedLanguages, parsedCertifications, parsedPortfolio, parsedSocialMedia, parsedPreferences;

        try {
            parsedSpecialties = JSON.parse(req.body.specialties || '[]');
            parsedLanguages = JSON.parse(req.body.languages || '[]');
            parsedCertifications = JSON.parse(req.body.certifications || '[]');
            parsedPortfolio = JSON.parse(req.body.portfolio || '[]');
            parsedSocialMedia = JSON.parse(req.body.socialMedia || '{}');
            parsedPreferences = JSON.parse(req.body.preferences || '{}');
        } catch (error) {
            return err(res, {
                code: 'INVALID_JSON',
                message: 'Invalid JSON format in one or more fields'
            }, 400);
        }

        // Create the application (NO phone, fullName, email, dateOfBirth)
        const application = await TrainerApplication.create({
            userId,
            specialties: parsedSpecialties,
            yearsOfExperience: req.body.yearsOfExperience ? parseInt(req.body.yearsOfExperience) : null,
            bio: req.body.bio,
            languages: parsedLanguages,
            certifications: parsedCertifications,
            portfolio: parsedPortfolio,
            socialMedia: parsedSocialMedia,
            preferences: parsedPreferences,
            status: 'pending',
            submittedAt: new Date()
        });

        // Handle uploaded files
        if (req.files && req.files.length > 0) {
            const fileRecords = req.files.map(file => ({
                applicationId: application.id,
                fileName: file.originalname,
                fileUrl: `/api/v1/uploads/applications/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size
            }));

            await CertificationFile.bulkCreate(fileRecords);
        }

        // Fetch the created application with user data
        const createdApplication = await TrainerApplication.findByPk(application.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
                },
                {
                    model: CertificationFile,
                    as: 'certificationFiles'
                }
            ]
        });

        ok(res, createdApplication, 'Application submitted successfully');

    } catch (error) {
        console.error('Error submitting application:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to submit application',
            details: error.message
        }, 500);
    }
});

// GET /api/v1/trainer/apply/status - Check application status (for logged-in user)
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return err(res, {
                code: 'UNAUTHORIZED',
                message: 'User not authenticated'
            }, 401);
        }

        const application = await TrainerApplication.findOne({
            where: { userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
                },
                {
                    model: CertificationFile,
                    as: 'certificationFiles'
                }
            ]
        });

        if (!application) {
            return err(res, {
                code: 'APPLICATION_NOT_FOUND',
                message: 'No application found for this user'
            }, 404);
        }

        ok(res, application);

    } catch (error) {
        console.error('Error fetching application status:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to fetch application status',
            details: error.message
        }, 500);
    }
});

// PUT /api/v1/trainer/apply - Update existing application (for rejected applications)
router.put('/', upload.array('certifications', 10), async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return err(res, {
                code: 'UNAUTHORIZED',
                message: 'User not authenticated'
            }, 401);
        }

        const application = await TrainerApplication.findOne({
            where: { userId }
        });

        if (!application) {
            return err(res, {
                code: 'APPLICATION_NOT_FOUND',
                message: 'No application found for this user'
            }, 404);
        }

        // Only allow updates for rejected applications
        if (application.status !== 'rejected') {
            return err(res, {
                code: 'INVALID_STATUS',
                message: 'Can only update rejected applications'
            }, 400);
        }

        // Parse JSON fields
        let parsedSpecialties, parsedLanguages, parsedCertifications, parsedPortfolio, parsedSocialMedia, parsedPreferences;

        try {
            parsedSpecialties = JSON.parse(req.body.specialties || '[]');
            parsedLanguages = JSON.parse(req.body.languages || '[]');
            parsedCertifications = JSON.parse(req.body.certifications || '[]');
            parsedPortfolio = JSON.parse(req.body.portfolio || '[]');
            parsedSocialMedia = JSON.parse(req.body.socialMedia || '{}');
            parsedPreferences = JSON.parse(req.body.preferences || '{}');
        } catch (error) {
            return err(res, {
                code: 'INVALID_JSON',
                message: 'Invalid JSON format in one or more fields'
            }, 400);
        }

        // Update the application (NO user fields - those come from User model)
        await application.update({
            specialties: parsedSpecialties.length > 0 ? parsedSpecialties : application.specialties,
            yearsOfExperience: req.body.yearsOfExperience ? parseInt(req.body.yearsOfExperience) : application.yearsOfExperience,
            bio: req.body.bio || application.bio,
            languages: parsedLanguages.length > 0 ? parsedLanguages : application.languages,
            certifications: parsedCertifications.length > 0 ? parsedCertifications : application.certifications,
            portfolio: parsedPortfolio.length > 0 ? parsedPortfolio : application.portfolio,
            socialMedia: Object.keys(parsedSocialMedia).length > 0 ? parsedSocialMedia : application.socialMedia,
            preferences: Object.keys(parsedPreferences).length > 0 ? parsedPreferences : application.preferences,
            status: 'pending', // Reset to pending
            rejectionReason: null, // Clear rejection reason
            submittedAt: new Date()
        });

        // Handle new uploaded files
        if (req.files && req.files.length > 0) {
            const fileRecords = req.files.map(file => ({
                applicationId: application.id,
                fileName: file.originalname,
                fileUrl: `/api/v1/uploads/applications/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size
            }));

            await CertificationFile.bulkCreate(fileRecords);
        }

        // Fetch the updated application with user data
        const updatedApplication = await TrainerApplication.findByPk(application.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
                },
                {
                    model: CertificationFile,
                    as: 'certificationFiles'
                }
            ]
        });

        ok(res, updatedApplication, 'Application updated successfully');

    } catch (error) {
        console.error('Error updating application:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to update application',
            details: error.message
        }, 500);
    }
});

module.exports = router;
