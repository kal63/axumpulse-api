'use strict'

const { Sequelize } = require('sequelize')

// Allow either a full MYSQL_URI or individual DB_* env vars
const mysqlUri = process.env.MYSQL_URI

let sequelize
if (mysqlUri) {
    console.log('Using MYSQL_URI for database connection')
    sequelize = new Sequelize(mysqlUri, {
        logging: false,
        timezone: process.env.DB_TIMEZONE || '+00:00', // Use UTC to avoid timezone conversion issues
    })
} else {
    console.log('Using individual DB_* env vars for database connection')
    // Fallback to individual env vars (useful for local development)
    const dbName = process.env.DB_NAME || process.env.DATABASE || 'axumpulse'
    const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'root'
    const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD || null
    const dbHost = process.env.DB_HOST || '127.0.0.1'
    const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined
    const dbDialect = process.env.DB_DIALECT || 'mysql';

    sequelize = new Sequelize(dbName, dbUser, dbPass, {
        host: dbHost,
        port: dbPort,
        dialect: dbDialect,
        logging: false,
        timezone: process.env.DB_TIMEZONE || '+00:00', // Use UTC to avoid timezone conversion issues
        dialectOptions: {
            typeCast(field, next) {
                // Only attempt to parse fields that *look* like JSON text
                if (field.type === 'LONGTEXT' || field.type === 'TEXT') {
                    const value = field.string();

                    if (value && (value.startsWith('{') || value.startsWith('['))) {
                        try {
                            return JSON.parse(value);
                        } catch {
                            return value;
                        }
                    }

                    return value;
                }

                return next();
            }
        }
    })
}

module.exports = { sequelize }



