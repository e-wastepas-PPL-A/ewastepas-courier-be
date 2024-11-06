import express from 'express';
import {
    findWasteName,
    getWasteById,
    getAllWasteTypes,
    getWasteLists
} from '../controllers/wasteController.js';

const router = express.Router();

router.get('/waste', getWasteLists);
router.get('/waste/search', findWasteName);
router.get('/waste/types', getAllWasteTypes);
router.get('/waste/:id', getWasteById);

export default router;