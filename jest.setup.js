// Mock database connection
jest.mock('./src/config/database', () => ({
    sequelize: {
        authenticate: jest.fn().mockResolvedValue(true),
        sync: jest.fn().mockResolvedValue(true),
        close: jest.fn().mockResolvedValue(true),
    },
}))

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret'
process.env.DB_NAME = 'test_db'

// Suppress console logs in tests
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}




