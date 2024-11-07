import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // Change here
import routes from './routes/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import wasteRoutes from './routes/wasteRoutes.js';
import pickupRoutes from './routes/pickupRoutes.js';
import dropboxRoutes from './routes/dropboxRoutes.js';

const app = express();

const corsOptions = {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://34.16.66.175:8021', 'http://34.16.66.175:8020'], // Allowed domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
    credentials: true // If you want to send cookies or other credentials
};

app.use(express.json());
app.use(cors(corsOptions));

// Use routes
app.use('/api', routes, wasteRoutes, pickupRoutes, dropboxRoutes, authRoutes, userRoutes);

app.use((req, res, next) => {
    const error = new Error('Not Found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        message: error.message || 'Something went wrong!',
        status: error.status || 500
    });
});

export default app;
