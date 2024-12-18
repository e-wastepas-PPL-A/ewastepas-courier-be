import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import dropboxRoutes from './routes/dropboxRoutes.js';
import { logger } from "./utils/logger.js";
import http from 'http';
import crypto from 'crypto';

const app = express();

// CORS configuration with more robust settings
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware to add correlation ID for tracing
const addCorrelationId = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
};

// Enhanced request logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override the end function to log response details
    res.end = function(chunk, encoding) {
        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Log request and response details
        logger.info({
            message: 'HTTP Request',
            method: req.method,
            url: req.url,
            correlationId: req.correlationId,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            requestBody: req.body && Object.keys(req.body).length > 0 ?
                JSON.stringify(req.body) : 'No request body',
            requestHeaders: JSON.stringify(req.headers)
        });

        // Call the original end function
        originalEnd.call(this, chunk, encoding);
    };

    next();
};

// Apply middlewares
app.use(cors(corsOptions));
app.use(addCorrelationId);
app.use(requestLogger);

// Request parsing with limits and security
app.use(express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
        try {
            JSON.parse(buf.toString());
        } catch (e) {
            logger.warn({
                message: 'Invalid JSON',
                correlationId: req.correlationId,
                error: e.message
            });
            throw new Error('Invalid JSON');
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Use routes
app.use('/api', routes, wasteRoutes, pickupRoutes, dropboxRoutes, authRoutes, userRoutes);

// Static file serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, '../')));

// 404 handler
app.use((req, res, next) => {
    const error = new Error('Hmm, looks like this page doesn\'t exist.');
    error.status = 404;
    next(error);
});

// Comprehensive error handler
app.use((error, req, res, next) => {
    // Determine error details
    const status = error.status || 500;
    const errorResponse = {
        success: false,
        status,
        message: status === 500 ? 'Internal Server Error' : error.message,
        correlationId: req.correlationId
    };

    // Detailed error logging
    logger.error({
        message: 'Application Error',
        correlationId: req.correlationId,
        errorMessage: error.message,
        errorStack: error.stack,
        requestDetails: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body
        }
    });

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    res.status(status).json(errorResponse);
});

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown handler
const gracefulShutdown = () => {
    logger.info('Received shutdown signal. Closing server...');
    server.close((err) => {
        if (err) {
            logger.error({
                message: 'Error during server shutdown',
                error: err
            });
            process.exitCode = 1;
        }

        // Additional cleanup can be added here
        logger.info('Server closed. Exiting process.');
        process.exit();
    });

    // Force close server after 10 seconds
    setTimeout(() => {
        logger.warn('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle various termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, server };