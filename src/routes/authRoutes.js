import express from 'express';
import {uploads} from '../middleware/imageUploadMiddleware.js';
import { helloAuth,verify,generateOTP} from '../controllers/authController.js';

const upload = uploads.fields([{name: 'ktp', maxCount:1}, {name: 'kk', maxCount: 1}])
const router = express.Router();

router.post('/auth/registrasi', generateOTP);
router.post('/auth/registrasi/verify', verify);
router.post('/auth', upload, helloAuth)

export default router;