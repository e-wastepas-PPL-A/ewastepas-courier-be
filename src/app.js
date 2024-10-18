import express from 'express';
import routes from './routes/index.js';

const app = express();

app.use(express.json());

// Use routes
app.use('/api', routes);

export default app;