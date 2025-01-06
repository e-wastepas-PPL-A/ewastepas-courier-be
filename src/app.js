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
import { logger } from './utils/logger.js';
import http from 'http';
import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

const app = express();

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

const addCorrelationId = (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);
    next();
};

const getClientIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    return forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip || req.connection.remoteAddress;
};

const getClientDevice = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    return {
        browser: `${result.browser.name} ${result.browser.version}`,
        os: `${result.os.name} ${result.os.version}`,
        device: result.device.type || 'desktop',
    };
};

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const clientIp = getClientIp(req);
    const clientDevice = getClientDevice(req);

    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        logger.info({
            message: 'HTTP Request',
            method: req.method,
            url: req.url,
            correlationId: req.correlationId,
            clientIp,
            clientDevice,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            requestBody: req.body && Object.keys(req.body).length > 0 ? JSON.stringify(req.body) : 'No request body'
        });
    });

    next();
};

app.use(cors(corsOptions));
app.use(addCorrelationId);
app.use(requestLogger);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api', routes, wasteRoutes, pickupRoutes, dropboxRoutes, authRoutes, userRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, '../')));

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    const status = error.status || 500;
    const clientIp = getClientIp(req);
    const clientDevice = getClientDevice(req);
    const errorResponse = {
        success: false,
        status,
        message: status === 500 ? 'Internal Server Error' : error.message,
        correlationId: req.correlationId
    };

    logger.error({
        message: 'Application Error',
        correlationId: req.correlationId,
        clientIp,
        clientDevice,
        errorMessage: error.message,
        errorStack: error.stack,
        requestDetails: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body
        }
    });

    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }

    res.status(status).json(errorResponse);
});

const server = http.createServer(app);

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
        logger.info('Server closed. Exiting process.');
        process.exit();
    });

    setTimeout(() => {
        logger.warn('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export { app, server };