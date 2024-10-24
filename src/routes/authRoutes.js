import express from 'express'
import {verifyOTP, registration, login} from '../controllers/authController.js'

const router = express.Router()

router.post('/auth/registration', registration)
router.post('/auth/verify_otp', verifyOTP)
router.post('/auth/login', login)

export default router;