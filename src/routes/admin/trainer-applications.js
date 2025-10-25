'use strict';

const express = require('express');
const router = express.Router();
const { TrainerApplication, CertificationFile, Trainer, User } = require('../../models');
const { ok, err } = require('../../utils/errors');
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination');
const { Op } = require('sequelize');

// Apply middleware
const { requireAuth, requireAdmin } = require('../../middleware');
router.use(requireAuth);
router.use(requireAdmin);

// GET /api/v1/admin/trainer-applications - List all applications
router.get('/', async (req, res) => {
    try {
        const {
            status,
            q,
            sortBy = 'submittedAt',
            sortOrder = 'DESC'
        } = req.query;

        const pagination = getPagination(req.query);

        // Build where clause for TrainerApplication
        const whereClause = {};

        if (status) {
            whereClause.status = status;
        }

        // Build User where clause for search
        const userWhereClause = {};
        if (q) {
            userWhereClause[Op.or] = [
                { name: { [Op.like]: `%${q}%` } },
                { phone: { [Op.like]: `%${q}%` } },
                { email: { [Op.like]: `%${q}%` } }
            ];
        }

        // Build order clause
        const orderClause = [[sortBy, sortOrder.toUpperCase()]];

        // Execute paginated query with User data included
        const result = await executePaginatedQueryWithSeparateCount(
            TrainerApplication,
            {
                where: whereClause,
                order: orderClause,
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'name', 'phone', 'email', 'profilePicture'],
                        where: Object.keys(userWhereClause).length > 0 ? userWhereClause : undefined,
                        required: Object.keys(userWhereClause).length > 0 // INNER JOIN when searching
                    },
                    {
                        model: CertificationFile,
                        as: 'certificationFiles'
                    }
                ]
            },
            pagination
        );

        ok(res, result);

    } catch (error) {
        console.error('Error fetching trainer applications:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to fetch applications',
            details: error.message
        }, 500);
    }
});

// GET /api/v1/admin/trainer-applications/stats - Get application statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await TrainerApplication.findAll({
            attributes: [
                'status',
                [TrainerApplication.sequelize.fn('COUNT', TrainerApplication.sequelize.col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const totalApplications = await TrainerApplication.count();
        const pendingCount = stats.find(s => s.status === 'pending')?.count || 0;
        const approvedCount = stats.find(s => s.status === 'approved')?.count || 0;
        const rejectedCount = stats.find(s => s.status === 'rejected')?.count || 0;
        const underReviewCount = stats.find(s => s.status === 'under_review')?.count || 0;

        ok(res, {
            data: {
                total: totalApplications,
                pending: pendingCount,
                approved: approvedCount,
                rejected: rejectedCount,
                underReview: underReviewCount
            }
        });

    } catch (error) {
        console.error('Error fetching application stats:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to fetch application statistics',
            details: error.message
        }, 500);
    }
});

// GET /api/v1/admin/trainer-applications/:id - Get application details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const application = await TrainerApplication.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'phone', 'email', 'profilePicture', 'dateOfBirth']
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
                message: 'Application not found'
            }, 404);
        }

        ok(res, { data: application });

    } catch (error) {
        console.error('Error fetching application details:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to fetch application details',
            details: error.message
        }, 500);
    }
});

// POST /api/v1/admin/trainer-applications/:id/approve - Approve application
router.post('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;
        const adminId = req.user?.id;

        const application = await TrainerApplication.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'user'
                }
            ]
        });

        if (!application) {
            return err(res, {
                code: 'APPLICATION_NOT_FOUND',
                message: 'Application not found'
            }, 404);
        }

        if (application.status === 'approved') {
            return err(res, {
                code: 'ALREADY_APPROVED',
                message: 'Application is already approved'
            }, 400);
        }

        const userId = application.userId;

        // Update application status
        await application.update({
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: adminId,
            adminNotes: adminNotes || application.adminNotes
        });

        // Check if trainer record already exists
        let trainer = await Trainer.findOne({
            where: { userId }
        });

        if (!trainer) {
            // Create new trainer record
            trainer = await Trainer.create({
                userId,
                bio: application.bio,
                specialties: application.specialties,
                verified: true,
                verifiedAt: new Date(),
                verifiedBy: adminId,
                applicationId: application.id
            });
        } else {
            // Update existing trainer
            await trainer.update({
                verified: true,
                verifiedAt: new Date(),
                verifiedBy: adminId,
                applicationId: application.id
            });
        }

        // Update User.isTrainer flag
        const user = await User.findByPk(userId);
        if (user && !user.isTrainer) {
            await user.update({ isTrainer: true });
        }

        // Fetch updated application with all includes
        const updatedApplication = await TrainerApplication.findByPk(id, {
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

        ok(res, {
            data: updatedApplication,
            message: 'Application approved successfully. User is now a trainer.'
        });

    } catch (error) {
        console.error('Error approving application:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to approve application',
            details: error.message
        }, 500);
    }
});

// POST /api/v1/admin/trainer-applications/:id/reject - Reject application
router.post('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason, adminNotes } = req.body;
        const adminId = req.user?.id;

        if (!rejectionReason) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Rejection reason is required'
            }, 400);
        }

        const application = await TrainerApplication.findByPk(id);
        if (!application) {
            return err(res, {
                code: 'APPLICATION_NOT_FOUND',
                message: 'Application not found'
            }, 404);
        }

        if (application.status === 'rejected') {
            return err(res, {
                code: 'ALREADY_REJECTED',
                message: 'Application is already rejected'
            }, 400);
        }

        // Update application status
        await application.update({
            status: 'rejected',
            rejectionReason,
            reviewedAt: new Date(),
            reviewedBy: adminId,
            adminNotes: adminNotes || application.adminNotes
        });

        // Fetch updated application with files
        const updatedApplication = await TrainerApplication.findByPk(id, {
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

        ok(res, {
            data: updatedApplication,
            message: 'Application rejected successfully'
        });

    } catch (error) {
        console.error('Error rejecting application:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to reject application',
            details: error.message
        }, 500);
    }
});

// POST /api/v1/admin/trainer-applications/:id/notes - Add admin notes
router.post('/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminNotes } = req.body;

        if (!adminNotes) {
            return err(res, {
                code: 'VALIDATION_ERROR',
                message: 'Admin notes are required'
            }, 400);
        }

        const application = await TrainerApplication.findByPk(id);
        if (!application) {
            return err(res, {
                code: 'APPLICATION_NOT_FOUND',
                message: 'Application not found'
            }, 404);
        }

        // Update admin notes
        await application.update({
            adminNotes: adminNotes
        });

        ok(res, {
            data: application,
            message: 'Admin notes updated successfully'
        });

    } catch (error) {
        console.error('Error updating admin notes:', error);
        err(res, {
            code: 'SERVER_ERROR',
            message: 'Failed to update admin notes',
            details: error.message
        }, 500);
    }
});

module.exports = router;
