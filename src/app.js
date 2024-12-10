import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors'; // Change here
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import dropboxRoutes from './routes/dropboxRoutes.js';
import { logger } from "./utils/logger.js";

const app = express();

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://34.16.66.175:8020/'],  // Allow requests from localhost:8000
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],  // Allow these HTTP methods
    credentials: true,  // If your frontend needs to send credentials like cookies
};

app.use(cors(corsOptions));

// Request parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Use routes
app.use('/api', routes, wasteRoutes, pickupRoutes, dropboxRoutes, authRoutes, userRoutes);

// Log incoming requests
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// 404 handler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, '../')));

app.use((req, res, next) => {
    const error = new Error('Hmm, looks like this page doesn\'t exist.');
    error.status = 404;
    next(error);
});

// Error handler
app.use((error, req, res, next) => {
    // Log error for monitoring
    logger.error(`${error.message} - ${error.stack}`);

    const status = error.status || 500;
    const message = status === 500 ? 'Internal Server Error' : error.message;

    res.status(status).json({
        success: false,
        status,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated!');
    });
});

export default app;