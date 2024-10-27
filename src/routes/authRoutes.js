import express from 'express'
import {verifyOTP, registration, login, forgotPassword, sendOTP} from '../controllers/authController.js'
import {JWTValidation} from '../middleware/JWTValidation.js'
import { emailCheck } from '../middleware/emailCheck.js'

const router = express.Router()

router.post('/auth/registration', emailCheck, registration)
router.post('/auth/verify-otp', verifyOTP)
router.post('/auth/send-otp', sendOTP)
router.post('/auth/login', login)
router.patch('/auth/forgot-password', JWTValidation, forgotPassword)


export default router;