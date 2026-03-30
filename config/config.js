require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || process.env.DATABASE || 'axumpulse',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+00:00',
    dialectOptions: {
      // Fix for MySQL 8+ / caching_sha2_password when server doesn't expose RSA key.
      // Allows the client (mysql2) to request the public key during auth.
      allowPublicKeyRetrieval: true
    }
  },
  test: {
    username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME || 'axumpulse_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+00:00',
    dialectOptions: {
      allowPublicKeyRetrieval: true
    }
  },
  production: {
    use_env_variable: process.env.MYSQL_URI ? 'MYSQL_URI' : undefined,
    username: process.env.DB_USER || process.env.DB_USERNAME || undefined,
    password: process.env.DB_PASS || process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || undefined,
    host: process.env.DB_HOST || undefined,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: process.env.DB_TIMEZONE || '+00:00',
    dialectOptions: {
      allowPublicKeyRetrieval: true
    }
  }
};
