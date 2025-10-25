require('dotenv').config();
const app = require('./server');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

async function startServer() {
    try {
        // Test database connection
        console.log('Checking database connection...');
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Sync database (create tables if they don't exist)
        console.log('Syncing database models...');
        //await sequelize.sync({ alter: true }); // alter: true will update existing tables
        console.log('✅ Database models synced successfully.');

        // Start the server
        app.listen(PORT, () => {
            console.log(`🚀 API listening on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
            console.log(`🔐 Admin API: http://localhost:${PORT}/api/v1/admin`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();



