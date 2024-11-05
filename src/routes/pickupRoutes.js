import express from 'express';
import {
    acceptPickupRequest,
    getAllPickupRequest
} from '../controllers/pickupController.js';

const router = express.Router();

router.get('/pickup', getAllPickupRequest);
router.get('/pickup/:id', acceptPickupRequest);


export default router;
