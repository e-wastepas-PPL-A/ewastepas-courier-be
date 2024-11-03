import e, { json } from "express";
import { prisma } from "../database.js";
import { sendOTPEmail } from "../controllers/authController.js";

export const emailCheck = async (req, res, next) => {
    const {email} = req.body

    const courier = await prisma.courier.findUnique({
        where: {
            email: email
        }
    })

    if(courier){
        const isActive = courier.is_active

        if(!isActive){
            return res.status(403).json({
                error: "Your account has not been verified",
                email: email
            })
        }

        return res.status(409).json({error: "This email is already registered"})
    }
    next()
}