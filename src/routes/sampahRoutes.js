import express from 'express';
import {getTotalWaste, getWasteTypes} from '../controllers/sampahController.js';

const router = express.Router();

router.get('/waste/types', getWasteTypes);
router.get('/waste/total/:id', getTotalWaste);

export default router;