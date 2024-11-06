import express from 'express';
import {
    acceptPickupRequest,
    getAllPickupRequest,
    getPickupRequestById,
    getCalculatePickupTotals
} from '../controllers/pickupController.js';

const router = express.Router();

router.get('/pickup', getAllPickupRequest);
router.get('/pickup/totals/:id', getCalculatePickupTotals);
router.get('/pickup/:id', getPickupRequestById);
router.post('/pickup/:id', acceptPickupRequest);

export default router;
