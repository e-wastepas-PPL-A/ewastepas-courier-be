import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger.js';
import crypto from 'crypto';

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
        logger.info('Database Query Execution', {
            correlationId,
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
            timestamp: new Date().toISOString()
        });
    });

    prisma.$on('error', (e) => {
        const correlationId = crypto.randomUUID(); // Generate a unique trace ID
        logger.error('Prisma Database Error', {
            correlationId,
            errorMessage: e.message,
            timestamp: new Date().toISOString(),
            stack: e.stack // Include stack trace for debugging
        });
    });

    prisma.$on('info', (e) => {
        const correlationId = crypto.randomUUID(); // Generate a unique trace ID
        logger.info('Prisma Database Info', {
            correlationId,
            message: e.message,
            timestamp: new Date().toISOString()
        });
    });

    prisma.$on('warn', (e) => {
        const correlationId = crypto.randomUUID(); // Generate a unique trace ID
        logger.warn('Prisma Database Warning', {
            correlationId,
            message: e.message,
            timestamp: new Date().toISOString()
        });
    });

    // Add connection lifecycle logging
    prisma.$connect()
        .then(() => {
            logger.info('Prisma Database Connection Established', {
                timestamp: new Date().toISOString()
            });
        })
        .catch((error) => {
            logger.error('Failed to Connect to Database', {
                error: error.message,
                timestamp: new Date().toISOString(),
                stack: error.stack // Include stack trace for debugging
            });
        });

    return prisma;
};

export const prisma = createPrismaClient();

// Global error handler for unhandled database connection issues
process.on('unhandledRejection', (reason, promise) => {
    const correlationId = crypto.randomUUID(); // Generate a unique trace ID
    logger.error('Unhandled Rejection at Database Connection', {
        correlationId,
        reason: reason instanceof Error ? reason.message : reason,
        promise: promise,
        timestamp: new Date().toISOString(),
        stack: reason instanceof Error ? reason.stack : undefined // Include stack trace if available
    });
});

// Optional: Graceful shutdown handler
process.on('SIGINT', async () => {
    try {
        await prisma.$disconnect();
        logger.info('Prisma Database Connection Gracefully Disconnected', {
            timestamp: new Date().toISOString()
        });
        process.exit(0);
    } catch (error) {
        logger.error('Error during database disconnection', {
            error: error.message,
            timestamp: new Date().toISOString(),
            stack: error.stack // Include stack trace for debugging
        });
        process.exit(1);
    }
});