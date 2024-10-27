import e, { json } from "express";
import { prisma } from "../database.js";
import { sendOTPEmail } from "../controllers/authController.js";

export const emailCheck = async (req, res, next) => {
    const {email} = req.body

    const user = await prisma.users.findUnique({
        where: {
            Email: email
        }
    })

    if(user){
        const isVerified = user.is_verified

        if(!isVerified){
            return res.status(403).json({
                error: "Your account has not been verified",
                email: email
            })
        }

        return res.status(409).json({error: "This email is already registered"})
    }
    next()
}