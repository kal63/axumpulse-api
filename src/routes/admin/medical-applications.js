'use strict'

const express = require('express')
const router = express.Router()
const { MedicalProfessionalApplication, MedicalCredentialFile, MedicalProfessional, User } = require('../../models')
const { ok, err } = require('../../utils/errors')
const { getPagination, executePaginatedQueryWithSeparateCount } = require('../../utils/pagination')
const { Op } = require('sequelize')

// Apply middleware
const { requireAuth, requireAdmin } = require('../../middleware')
router.use(requireAuth)
router.use(requireAdmin)

// GET /api/v1/admin/medical-applications - List all applications
router.get('/', async (req, res) => {
  try {
    const {
      status,
      q,
      sortBy = 'submittedAt',
      sortOrder = 'DESC'
    } = req.query

    const pagination = getPagination(req.query)

    // Build where clause for MedicalProfessionalApplication
    const whereClause = {}

    if (status) {
      whereClause.status = status
    }

    // Build User where clause for search
    const userWhereClause = {}
    if (q) {
      userWhereClause[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { phone: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ]
    }

    // Build order clause
    const orderClause = [[sortBy, sortOrder.toUpperCase()]]

    // Execute paginated query with User data included
    const result = await executePaginatedQueryWithSeparateCount(
      MedicalProfessionalApplication,
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
            model: MedicalCredentialFile,
            as: 'credentialFiles'
          }
        ]
      },
      pagination
    )

    ok(res, result)

  } catch (error) {
    console.error('Error fetching medical applications:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to fetch applications',
      details: error.message
    }, 500)
  }
})

// GET /api/v1/admin/medical-applications/stats - Get application statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await MedicalProfessionalApplication.findAll({
      attributes: [
        'status',
        [MedicalProfessionalApplication.sequelize.fn('COUNT', MedicalProfessionalApplication.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    })

    const totalApplications = await MedicalProfessionalApplication.count()
    const pendingCount = stats.find(s => s.status === 'pending')?.count || 0
    const approvedCount = stats.find(s => s.status === 'approved')?.count || 0
    const rejectedCount = stats.find(s => s.status === 'rejected')?.count || 0
    const underReviewCount = stats.find(s => s.status === 'under_review')?.count || 0

    ok(res, {
      data: {
        total: totalApplications,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        underReview: underReviewCount
      }
    })

  } catch (error) {
    console.error('Error fetching application stats:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to fetch application statistics',
      details: error.message
    }, 500)
  }
})

// GET /api/v1/admin/medical-applications/:id - Get application details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const application = await MedicalProfessionalApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email', 'profilePicture', 'dateOfBirth']
        },
        {
          model: MedicalCredentialFile,
          as: 'credentialFiles'
        }
      ]
    })

    if (!application) {
      return err(res, {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      }, 404)
    }

    ok(res, { data: application })

  } catch (error) {
    console.error('Error fetching application details:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to fetch application details',
      details: error.message
    }, 500)
  }
})

// PUT /api/v1/admin/medical-applications/:id/approve - Approve application
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const { adminNotes } = req.body
    const adminId = req.user?.id

    const application = await MedicalProfessionalApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    })

    if (!application) {
      return err(res, {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      }, 404)
    }

    if (application.status === 'approved') {
      return err(res, {
        code: 'ALREADY_APPROVED',
        message: 'Application is already approved'
      }, 400)
    }

    const userId = application.userId

    // Update application status
    await application.update({
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: adminNotes || application.adminNotes
    })

    // Check if medical professional record already exists
    let medicalPro = await MedicalProfessional.findOne({
      where: { userId }
    })

    if (!medicalPro) {
      // Create new medical professional record
      medicalPro = await MedicalProfessional.create({
        userId,
        professionalType: application.professionalType,
        bio: application.bio,
        specialties: application.specialties,
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        applicationId: application.id
      })
    } else {
      // Update existing medical professional
      await medicalPro.update({
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
        applicationId: application.id
      })
    }

    // Update User.isMedical flag
    const user = await User.findByPk(userId)
    if (user && !user.isMedical) {
      await user.update({ isMedical: true })
    }

    // Fetch updated application with all includes
    const updatedApplication = await MedicalProfessionalApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
        },
        {
          model: MedicalCredentialFile,
          as: 'credentialFiles'
        }
      ]
    })

    ok(res, {
      data: updatedApplication,
      message: 'Application approved successfully. User is now a medical professional.'
    })

  } catch (error) {
    console.error('Error approving application:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to approve application',
      details: error.message
    }, 500)
  }
})

// PUT /api/v1/admin/medical-applications/:id/reject - Reject application
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const { rejectionReason, adminNotes } = req.body
    const adminId = req.user?.id

    if (!rejectionReason) {
      return err(res, {
        code: 'VALIDATION_ERROR',
        message: 'Rejection reason is required'
      }, 400)
    }

    const application = await MedicalProfessionalApplication.findByPk(id)
    if (!application) {
      return err(res, {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      }, 404)
    }

    if (application.status === 'rejected') {
      return err(res, {
        code: 'ALREADY_REJECTED',
        message: 'Application is already rejected'
      }, 400)
    }

    // Update application status
    await application.update({
      status: 'rejected',
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: adminNotes || application.adminNotes
    })

    // Fetch updated application with files
    const updatedApplication = await MedicalProfessionalApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
        },
        {
          model: MedicalCredentialFile,
          as: 'credentialFiles'
        }
      ]
    })

    ok(res, {
      data: updatedApplication,
      message: 'Application rejected successfully'
    })

  } catch (error) {
    console.error('Error rejecting application:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to reject application',
      details: error.message
    }, 500)
  }
})

// PUT /api/v1/admin/medical-applications/:id/under-review - Mark as under review
router.put('/:id/under-review', async (req, res) => {
  try {
    const { id } = req.params
    const { adminNotes } = req.body
    const adminId = req.user?.id

    const application = await MedicalProfessionalApplication.findByPk(id)
    if (!application) {
      return err(res, {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found'
      }, 404)
    }

    // Update application status
    await application.update({
      status: 'under_review',
      reviewedAt: new Date(),
      reviewedBy: adminId,
      adminNotes: adminNotes || application.adminNotes
    })

    // Fetch updated application
    const updatedApplication = await MedicalProfessionalApplication.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'phone', 'email', 'profilePicture']
        },
        {
          model: MedicalCredentialFile,
          as: 'credentialFiles'
        }
      ]
    })

    ok(res, {
      data: updatedApplication,
      message: 'Application marked as under review'
    })

  } catch (error) {
    console.error('Error updating application status:', error)
    err(res, {
      code: 'SERVER_ERROR',
      message: 'Failed to update application status',
      details: error.message
    }, 500)
  }
})

module.exports = router

