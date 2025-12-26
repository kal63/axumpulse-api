require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./server');
const { sequelize } = require('./models');
const { setupSocketHandlers } = require('./socket-handlers');

const PORT = process.env.PORT || 3000;

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

        // Create HTTP server from Express app
        const server = http.createServer(app);

        // Initialize Socket.io
        const io = new Server(server, {
            cors: {
                origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
                methods: ['GET', 'POST'],
                credentials: true,
                allowedHeaders: ['Authorization', 'Content-Type']
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true // Allow older Socket.io clients
        });

        // Setup Socket.io handlers
        setupSocketHandlers(io);
        console.log('✅ Socket.io initialized');

        // Start the server
        server.listen(PORT, () => {
            console.log(`🚀 API listening on port ${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/healthz`);
            console.log(`🔐 Admin API: http://localhost:${PORT}/api/v1/admin`);
            console.log(`🔌 Socket.io ready on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();



