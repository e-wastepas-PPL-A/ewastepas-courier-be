import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';

const createPrismaClient = () => {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL + '?connect_timeout=10&wait_timeout=28800'
            }
        },
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' }
        ]
    });

    // Enhanced logging with correlation ID and more detailed tracing
    prisma.$on('query', (e) => {
        const correlationId = crypto.randomUUID(); // Generate a unique trace ID
        logger.info({
            message: 'Database Query Execution',
            correlationId: correlationId,
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
            timestamp: new Date().toISOString()
        });
    });

    prisma.$on('error', (e) => {
        const correlationId = crypto.randomUUID(); // Generate a unique trace ID
        logger.error({
            message: 'Prisma Database Error',
            correlationId: correlationId,
            errorMessage: e.message,
            timestamp: new Date().toISOString(),
            // Optionally add more context like stack trace
            stack: e.stack
        });
    });

    // Add connection lifecycle logging
    prisma.$connect()
        .then(() => {
            logger.info({
                message: 'Prisma Database Connection Established',
                timestamp: new Date().toISOString()
            });
        })
        .catch((error) => {
            logger.error({
                message: 'Failed to Connect to Database',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });

    return prisma;
};

export const prisma = createPrismaClient();

// Global error handler for unhandled database connection issues
process.on('unhandledRejection', (reason, promise) => {
    const correlationId = crypto.randomUUID(); // Generate a unique trace ID
    logger.error({
        message: 'Unhandled Rejection at Database Connection',
        correlationId: correlationId,
        reason: reason,
        promise: promise,
        timestamp: new Date().toISOString()
    });
});

// Optional: Graceful shutdown handler
process.on('SIGINT', async () => {
    try {
        await prisma.$disconnect();
        logger.info({
            message: 'Prisma Database Connection Gracefully Disconnected',
            timestamp: new Date().toISOString()
        });
        process.exit(0);
    } catch (error) {
        logger.error({
            message: 'Error during database disconnection',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        process.exit(1);
    }
});