import express from 'express';
import {
    updatePickupStatusToAccepted,
    getAllPickupRequest,
    getPickupRequestById,
    getCalculatePickupTotals
} from '../controllers/pickupController.js';

const router = express.Router();

router.get('/pickup', getAllPickupRequest);
router.get('/pickup/:id', getPickupRequestById);
router.patch('/pickup/acc/:id', updatePickupStatusToAccepted);
router.get('/pickup/totals/:id', getCalculatePickupTotals);

export default router;
