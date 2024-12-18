import { server } from './app.js';
import { loadingAnimation } from "./utils/loadingAnimation.js";
import { logger } from "./utils/logger.js";
import http from 'http';

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
    try {
        // Optional loading animation
        await loadingAnimation(500); // Adjust duration as needed

        // Start the server
        server.listen(PORT, HOST, () => {
            logger.info({
                message: 'Server Started Successfully',
                port: PORT,
                host: HOST,
                environment: process.env.NODE_ENV || 'development',
                url: `http://${HOST}:${PORT}`,
                    timestamp: new Date().toISOString()
            });
        });

        // Handle server startup errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error({
                    message: 'Port is already in use',
                    port: PORT,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                process.exit(1);
            } else {
                logger.error({
                    message: 'Server Startup Error',
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                });
                process.exit(1);
            }
        });

        // Health check and performance monitoring
        const checkServerHealth = () => {
            const memoryUsage = process.memoryUsage();
            logger.info({
                message: 'Server Health Check',
                memoryUsage: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
                },
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        };

        // Run health check every 5 minutes
        const healthCheckInterval = setInterval(checkServerHealth, 5 * 60 * 1000);

        // Cleanup interval on server close
        server.on('close', () => {
            clearInterval(healthCheckInterval);
        });

    } catch (error) {
        logger.error({
            message: 'Failed to Start Server',
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        process.exit(1);
    }
};

// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (reason, promise) => {
    logger.error({
        message: 'Unhandled Promise Rejection',
        reason: reason,
        timestamp: new Date().toISOString()
    });
});

// Prevent uncaught exceptions from crashing the server
process.on('uncaughtException', (error) => {
    logger.error({
        message: 'Uncaught Exception',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    // Attempt a graceful shutdown
    server.close(() => {
        process.exit(1);
    });
});

startServer();