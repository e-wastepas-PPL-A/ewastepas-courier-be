import express from 'express';
import { getPickupRequests, acceptPickupRequest, getPickupHistory } from '../controllers/penjemputanController.js';

const router = express.Router();

router.get('/pickup/requests', getPickupRequests);
router.post('/pickup/accept/:id', acceptPickupRequest);
router.get('/pickup/history/:id', getPickupHistory);

export default router;
