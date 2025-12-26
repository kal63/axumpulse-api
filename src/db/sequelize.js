'use strict'

const { Sequelize } = require('sequelize')

// Allow either a full MYSQL_URI or individual DB_* env vars
const mysqlUri = process.env.MYSQL_URI

let sequelize
if (mysqlUri) {
    sequelize = new Sequelize(mysqlUri, {
        logging: false,
        timezone: process.env.DB_TIMEZONE || '+00:00', // Use UTC to avoid timezone conversion issues
    })
} else {
    // Fallback to individual env vars (useful for local development)
    const dbName = process.env.DB_NAME || process.env.DATABASE || 'axumpulse'
    const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'root'
    const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || null
    const dbHost = process.env.DB_HOST || '127.0.0.1'
    const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined
    const dbDialect = process.env.DB_DIALECT || 'mysql'

    sequelize = new Sequelize(dbName, dbUser, dbPass, {
        host: dbHost,
        port: dbPort,
        dialect: dbDialect,
        logging: false,
        timezone: process.env.DB_TIMEZONE || '+00:00', // Use UTC to avoid timezone conversion issues
    })
}

module.exports = { sequelize }



