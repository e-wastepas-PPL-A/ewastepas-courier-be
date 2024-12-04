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

    // Detailed logging for database operations
    prisma.$on('query', (e) => {
        logger.info(`Query: ${e.query}, Params: ${e.params}, Duration: ${e.duration}ms`);
    });

    prisma.$on('error', (e) => {
        logger.error('Prisma Error', { message: e.message });
    });

    return prisma;
};

export const prisma = createPrismaClient();

// Global error handler for unhandled database connection issues
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at database connection', {
        reason: reason,
        promise: promise
    });
});