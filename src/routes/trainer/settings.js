'use strict'

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { ok, err } = require('../../utils/errors')
const { User, Trainer, UserProfile } = require('../../models')

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/profiles')
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const userId = req.user?.id
        const ext = path.extname(file.originalname)
        const filename = `profile_${userId}_${Date.now()}${ext}`
        cb(null, filename)
    }
})

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
        const mimetype = allowedTypes.test(file.mimetype)

        if (mimetype && extname) {
            return cb(null, true)
        } else {
            cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'))
        }
    }
})

// GET /trainer/settings - Get current settings
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id

        const [user, trainer, profile] = await Promise.all([
            User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'profilePicture', 'dateOfBirth', 'gender', 'phone']
            }),
            Trainer.findOne({ where: { userId } }),
            UserProfile.findOne({ where: { userId } })
        ])

        if (!user) {
            return err(res, { code: 'USER_NOT_FOUND', message: 'User not found' }, 404)
        }

        const settings = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                phone: user.phone // Read-only, but included for display
            },
            trainer: trainer ? trainer.toJSON() : {
                bio: '',
                specialties: [],
                verified: false
            },
            profile: profile ? profile.toJSON() : {
                language: 'en',
                notificationSettings: {},
                fitnessGoals: {},
                healthMetrics: {},
                preferences: {}
            }
        }

        ok(res, settings)
    } catch (error) {
        err(res, error)
    }
})

// PUT /trainer/settings - Update settings
router.put('/', async (req, res) => {
    try {
        const userId = req.user?.id
        const { user: userData, trainer: trainerData, profile: profileData } = req.body

        // Update user data (excluding phone and password)
        if (userData) {
            const allowedUserFields = ['name', 'email', 'dateOfBirth', 'gender']
            const updateData = {}

            allowedUserFields.forEach(field => {
                if (userData[field] !== undefined) {
                    updateData[field] = userData[field]
                }
            })

            if (Object.keys(updateData).length > 0) {
                await User.update(updateData, { where: { id: userId } })
            }
        }

        // Update trainer data
        if (trainerData) {
            const allowedTrainerFields = ['bio', 'specialties']
            const updateData = {}

            allowedTrainerFields.forEach(field => {
                if (trainerData[field] !== undefined) {
                    updateData[field] = trainerData[field]
                }
            })

            if (Object.keys(updateData).length > 0) {
                await Trainer.upsert({
                    userId,
                    ...updateData
                })
            }
        }

        // Update profile data
        if (profileData) {
            const allowedProfileFields = ['language', 'notificationSettings', 'fitnessGoals', 'healthMetrics', 'preferences']
            const updateData = {}

            allowedProfileFields.forEach(field => {
                if (profileData[field] !== undefined) {
                    updateData[field] = profileData[field]
                }
            })

            if (Object.keys(updateData).length > 0) {
                await UserProfile.upsert({
                    userId,
                    ...updateData
                })
            }
        }

        // Fetch updated data
        const [user, trainer, profile] = await Promise.all([
            User.findByPk(userId, {
                attributes: ['id', 'name', 'email', 'profilePicture', 'dateOfBirth', 'gender', 'phone']
            }),
            Trainer.findOne({ where: { userId } }),
            UserProfile.findOne({ where: { userId } })
        ])

        const updatedSettings = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                dateOfBirth: user.dateOfBirth,
                gender: user.gender,
                phone: user.phone
            },
            trainer: trainer ? trainer.toJSON() : {
                bio: '',
                specialties: [],
                verified: false
            },
            profile: profile ? profile.toJSON() : {
                language: 'en',
                notificationSettings: {},
                fitnessGoals: {},
                healthMetrics: {},
                preferences: {}
            }
        }

        ok(res, { message: 'Settings updated successfully', settings: updatedSettings })
    } catch (error) {
        err(res, error)
    }
})

// POST /trainer/settings/profile-image - Upload profile image
router.post('/profile-image', upload.single('profileImage'), async (req, res) => {
    try {
        const userId = req.user?.id

        if (!req.file) {
            return err(res, { code: 'NO_FILE', message: 'No profile image file provided' }, 400)
        }

        // Delete old profile image if it exists
        const user = await User.findByPk(userId, { attributes: ['profilePicture'] })
        if (user?.profilePicture) {
            const oldImagePath = path.join(__dirname, '../../uploads', user.profilePicture.replace('/api/v1/uploads/', ''))
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath)
            }
        }

        // Update user with new profile image path
        const imagePath = `/api/v1/uploads/profiles/${req.file.filename}`
        await User.update(
            { profilePicture: imagePath },
            { where: { id: userId } }
        )

        ok(res, {
            message: 'Profile image updated successfully',
            profilePicture: imagePath
        })
    } catch (error) {
        // Clean up uploaded file if there was an error
        if (req.file) {
            const filePath = path.join(__dirname, '../../uploads/profiles', req.file.filename)
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath)
            }
        }
        err(res, error)
    }
})

// DELETE /trainer/settings/profile-image - Remove profile image
router.delete('/profile-image', async (req, res) => {
    try {
        const userId = req.user?.id

        const user = await User.findByPk(userId, { attributes: ['profilePicture'] })
        if (user?.profilePicture) {
            // Delete the file from filesystem
            const imagePath = path.join(__dirname, '../../uploads', user.profilePicture.replace('/api/v1/uploads/', ''))
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath)
            }
        }

        // Update user to remove profile image
        await User.update(
            { profilePicture: null },
            { where: { id: userId } }
        )

        ok(res, { message: 'Profile image removed successfully' })
    } catch (error) {
        err(res, error)
    }
})


module.exports = router
