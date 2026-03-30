'use strict'

const { Content } = require('../models')

/**
 * Ensure contentId refers to an approved video owned by the trainer with a file URL.
 * @param {number} trainerId - User id (same as Content.trainerId in this codebase)
 * @param {number|null|undefined} contentId
 * @returns {Promise<number|null>} resolved contentId or null to clear
 */
async function resolveApprovedVideoContentId(trainerId, contentId) {
    if (contentId === undefined) {
        return undefined
    }
    if (contentId === null || contentId === '') {
        return null
    }
    const id = typeof contentId === 'string' ? parseInt(contentId, 10) : contentId
    if (!Number.isFinite(id) || id < 1) {
        const err = new Error('Invalid contentId')
        err.code = 'VALIDATION_ERROR'
        throw err
    }
    const row = await Content.findByPk(id)
    if (!row) {
        const err = new Error('Content not found')
        err.code = 'NOT_FOUND'
        throw err
    }
    if (row.trainerId !== trainerId) {
        const err = new Error('You can only attach your own content')
        err.code = 'FORBIDDEN'
        throw err
    }
    if (row.type !== 'video') {
        const err = new Error('Only video content can be attached')
        err.code = 'VALIDATION_ERROR'
        throw err
    }
    if (row.status !== 'approved') {
        const err = new Error('Only approved videos can be attached')
        err.code = 'VALIDATION_ERROR'
        throw err
    }
    if (!row.fileUrl || String(row.fileUrl).trim() === '') {
        const err = new Error('Video has no file URL')
        err.code = 'VALIDATION_ERROR'
        throw err
    }
    return id
}

module.exports = { resolveApprovedVideoContentId }
