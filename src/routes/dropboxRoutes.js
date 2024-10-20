// routes/dropboxRoutes.js

import express from 'express';
import { getDropbox } from '../controllers/dropboxController.js';

const router = express.Router();

router.get('/dropbox/terdekat', getDropbox);

export default router;