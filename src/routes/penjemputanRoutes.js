import express from 'express';
import { getPermintaan, terimaPermintaan, getHistory } from '../controllers/penjemputanController.js';

const router = express.Router();

router.get('/penjemputan/permintaan', getPermintaan);
router.post('/penjemputan/terima', terimaPermintaan);
router.get('/penjemputan/history', getHistory);

export default router;