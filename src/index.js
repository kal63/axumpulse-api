require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./server');
const { sequelize, ConsultBooking } = require('./models');
const { Op } = require('sequelize');
const { setupSocketHandlers } = require('./socket-handlers');

const PORT = process.env.PORT || 3000;

async function cleanupStaleCalls() {
    try {
        console.log('Cleaning up stale calls from previous server session...');
        const result = await ConsultBooking.update(
            {
                callStatus: 'ended',
                callEndedAt: new Date()
            },
            {
                where: {
                    callStatus: {
                        [Op.in]: ['ringing', 'in_progress']
                    }
                }
            }
        );
        if (result[0] > 0) {
            console.log(`✅ Reset ${result[0]} stale call(s) to 'ended' status`);
        } else {
            console.log('✅ No stale calls found');
        }
    } catch (error) {
        console.error('⚠️ Error cleaning up stale calls:', error);
        // Don't fail server startup if cleanup fails
    }
}

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

        // Clean up any stale calls from previous server session
        await cleanupStaleCalls();

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



