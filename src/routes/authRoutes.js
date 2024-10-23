import express from 'express';
import {uploads} from '../middleware/imageUploadMiddleware.js';
import { helloAuth,verify,generateOTP} from '../controllers/authController.js';

const router = express.Router();

router.post('/auth/registrasi', generateOTP);
router.post('/auth/registrasi/verify', verify);
router.post('/auth', uploads, helloAuth)

export default router;