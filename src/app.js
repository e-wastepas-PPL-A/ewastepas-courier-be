import express from 'express';
import routes from './routes/index.js';
import sampahRoutes from './routes/sampahRoutes.js';
import penjemputanRoutes from './routes/penjemputanRoutes.js';
import dropboxRoutes from './routes/dropboxRoutes.js';

const app = express();

app.use(express.json());

// Use routes
app.use('/api', routes, sampahRoutes, penjemputanRoutes, dropboxRoutes);

export default app;