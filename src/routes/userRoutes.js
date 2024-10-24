import express from 'express'
import { upload } from '../middleware/imageUploadMiddleware.js'
import { getAllUsers, updateUserData, changePassword } from '../controllers/userContoller.js'

const router = express.Router()

router.get('/user', getAllUsers)
router.patch('/user', upload.fields([{name: 'ktp', maxCount:1}, {name: 'kk', maxCount: 1}, {name: 'foto', maxCount: 1}]), updateUserData)
router.patch('/user/reset_password', changePassword)

export default router