import express from 'express';
import {
    findWasteName,
    getAllWaste, getAllWasteTypes, getWasteLists
} from '../controllers/wasteController.js';

const router = express.Router();

router.get('/waste/:id', getAllWaste);
router.get('/waste', getWasteLists);
router.get('/waste/search', findWasteName);
router.get('/types', getAllWasteTypes);

export default router;