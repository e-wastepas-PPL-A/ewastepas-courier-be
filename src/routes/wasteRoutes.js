import express from 'express';
import {
    findWasteName,
    getAllWaste, getWasteLists
} from '../controllers/wasteController.js';

const router = express.Router();

router.get('/waste/:id', getAllWaste);
router.get('/waste', getWasteLists);
router.get('/waste/search', findWasteName);

export default router;