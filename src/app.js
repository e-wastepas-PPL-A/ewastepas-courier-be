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

const app = express();

const corsOptions = {
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://34.16.66.175:8021', 'http://34.16.66.175:8020'], // Allowed domains
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed HTTP methods
    credentials: true // If you want to send cookies or other credentials
};

app.use(express.json());
app.use(cors(corsOptions));

// Use routes
app.use('/api', routes, wasteRoutes, pickupRoutes, dropboxRoutes, authRoutes, userRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(path.join(__dirname, '../')));

app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    if (error.status === 404) {
        const redirectDuration = req.query.redirectDuration || 5000;
        const countdownTime = redirectDuration / 1000;

        return res.status(404).send(`
            <html>
                <head>
                    <title>404 - Not Found</title>
                    <script type="text/javascript">
                        var countdown = ${countdownTime};
                        function updateCountdown() {
                            if (countdown >= 0) {
                                document.getElementById("countdown").innerHTML = countdown;
                                countdown--;
                            } else {
                                window.location.href = '/';
                            }
                        }
                        setInterval(updateCountdown, 1000); 
                    </script>
                </head>
                <body>
                    <h1>404 - Route Not Found</h1>
                    <p>Sorry, the page you're looking for doesn't exist. You will be redirected to the homepage in <span id="countdown">${countdownTime}</span> seconds...</p>
                </body>
            </html>
        `);
    }

    res.status(error.status || 500).json({
        message: error.message || 'Something went wrong!',
        status: error.status || 500
    });
});

export default app;
