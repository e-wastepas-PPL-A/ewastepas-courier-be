import express from 'express';
import {
    updatePickupStatusToAccepted,
    getAllPickupRequest,
    getPickupRequestById,
    getCalculatePickupTotals,
    updatePickupStatusToCancelled
} from '../controllers/pickupController.js';

const router = express.Router();

router.get('/pickup', getAllPickupRequest);
router.get('/pickup/:id', getPickupRequestById);
router.patch('/pickup/accept/:id', updatePickupStatusToAccepted);
router.patch('/pickup/cancel/:id', updatePickupStatusToCancelled);
router.get('/pickup/totals/:id', getCalculatePickupTotals);

export default router;
