'use strict'

const request = require('supertest')
const express = require('express')
const { router } = require('../../../routes/user/challenges')

// Mock dependencies
jest.mock('../../../models', () => ({
    Challenge: {
        findAll: jest.fn(),
        findOne: jest.fn(),
    },
    UserChallengeProgress: {
        findAll: jest.fn(),
        count: jest.fn(),
    },
    Trainer: {},
    User: {},
}))

const { Challenge, UserChallengeProgress } = require('../../../models')

// Create test app
const app = express()
app.use(express.json())
app.use((req, res, next) => {
    req.user = { id: 1 } // Mock authenticated user
    next()
})
app.use('/challenges', router)

describe('Challenge Routes - Phase 3', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('GET /challenges', () => {
        it('returns list of approved challenges', async () => {
            const mockChallenges = [
                {
                    id: 1,
                    title: 'Test Challenge',
                    status: 'approved',
                    isPublic: true,
                },
            ]

            Challenge.findAll.mockResolvedValue(mockChallenges)

            const response = await request(app).get('/challenges')

            expect(response.status).toBe(200)
            expect(Challenge.findAll).toHaveBeenCalled()
        })

        it('filters challenges by status', async () => {
            Challenge.findAll.mockResolvedValue([])

            await request(app).get('/challenges?status=active')

            expect(Challenge.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'approved',
                        isPublic: true,
                    }),
                })
            )
        })

        it('filters challenges by category', async () => {
            Challenge.findAll.mockResolvedValue([])

            await request(app).get('/challenges?category=Strength')

            expect(Challenge.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        category: 'Strength',
                    }),
                })
            )
        })

        it('filters challenges by difficulty', async () => {
            Challenge.findAll.mockResolvedValue([])

            await request(app).get('/challenges?difficulty=beginner')

            expect(Challenge.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        difficulty: 'beginner',
                    }),
                })
            )
        })
    })

    describe('GET /challenges/:id', () => {
        it('returns challenge with leaderboard', async () => {
            const mockChallenge = {
                id: 1,
                title: 'Test Challenge',
                status: 'approved',
                isPublic: true,
            }

            const mockLeaderboard = [
                {
                    userId: 1,
                    progress: 100,
                    status: 'completed',
                },
            ]

            Challenge.findOne.mockResolvedValue(mockChallenge)
            UserChallengeProgress.findAll.mockResolvedValue(mockLeaderboard)
            UserChallengeProgress.count.mockResolvedValue(10)

            const response = await request(app).get('/challenges/1')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.challenge).toEqual(mockChallenge)
            expect(response.body.data.leaderboard).toEqual(mockLeaderboard)
            expect(response.body.data.participantCount).toBe(10)
        })

        it('returns 404 for non-existent challenge', async () => {
            Challenge.findOne.mockResolvedValue(null)

            const response = await request(app).get('/challenges/999')

            expect(response.status).toBe(404)
            expect(response.body.success).toBe(false)
        })
    })

    describe('GET /challenges/:id/leaderboard', () => {
        it('returns full leaderboard with rankings', async () => {
            const mockChallenge = {
                id: 1,
                status: 'approved',
                isPublic: true,
            }

            const mockLeaderboard = [
                { userId: 1, progress: 100, toJSON: function () { return this } },
                { userId: 2, progress: 90, toJSON: function () { return this } },
                { userId: 3, progress: 80, toJSON: function () { return this } },
            ]

            Challenge.findOne.mockResolvedValue(mockChallenge)
            UserChallengeProgress.findAll.mockResolvedValue(mockLeaderboard)
            UserChallengeProgress.findOne.mockResolvedValue(null)
            UserChallengeProgress.count
                .mockResolvedValueOnce(0) // For user rank calculation
                .mockResolvedValueOnce(10) // For total participants

            const response = await request(app).get('/challenges/1/leaderboard')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.leaderboard).toHaveLength(3)
            expect(response.body.data.leaderboard[0].rank).toBe(1)
            expect(response.body.data.leaderboard[1].rank).toBe(2)
            expect(response.body.data.totalParticipants).toBe(10)
        })

        it('respects limit parameter', async () => {
            Challenge.findOne.mockResolvedValue({ id: 1, status: 'approved', isPublic: true })
            UserChallengeProgress.findAll.mockResolvedValue([])
            UserChallengeProgress.findOne.mockResolvedValue(null)
            UserChallengeProgress.count.mockResolvedValue(0)

            await request(app).get('/challenges/1/leaderboard?limit=10')

            expect(UserChallengeProgress.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    limit: 10,
                })
            )
        })

        it('returns 404 for non-existent challenge', async () => {
            Challenge.findOne.mockResolvedValue(null)

            const response = await request(app).get('/challenges/999/leaderboard')

            expect(response.status).toBe(404)
        })
    })

    describe('GET /challenges/categories', () => {
        it('returns available challenge categories', async () => {
            const mockCategories = [
                { category: 'Strength' },
                { category: 'Cardio' },
                { category: 'Flexibility' },
            ]

            Challenge.findAll.mockResolvedValue(mockCategories)

            const response = await request(app).get('/challenges/categories')

            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.categories).toContain('Strength')
            expect(response.body.data.categories).toContain('Cardio')
        })
    })
})




