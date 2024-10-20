import express from 'express';
import { getJenisSampah, getTotalSampah } from '../controllers/sampahController.js';

const router = express.Router();

router.get('/sampah/jenis', getJenisSampah);
router.get('/sampah/total', getTotalSampah);

export default router;