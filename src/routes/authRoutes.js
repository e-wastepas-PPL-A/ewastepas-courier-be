import express from 'express';
import { helloAuth,verify,generateOTP} from '../controllers/authController.js';

const router = express.Router();

router.post('/auth/registrasi', generateOTP);
router.post('/auth/registrasi/verify', verify);

export default router;