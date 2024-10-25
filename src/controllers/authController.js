import 'dotenv/config'
import speakeasy from 'speakeasy'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { prisma } from '../database.js'
import { json } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const {EMAIL,SECRET_KEYS,CLIENT_ID,CLIENT_SECRET,REDIRECT_URL,REFRESH_TOKEN} = process.env

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URL)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

const generatorOTP = () => {
    const otp = speakeasy.totp({
        secret: SECRET_KEYS,
        encoding: 'base32',
        step: 180
    })
    return otp
}

const sendOTPEmail = async (email,otp) => {
    const accessToken = await oAuth2Client.getAccessToken()
    let transporter = nodemailer.createTransport({
        service: 'gmail',  
        auth: {
            type: 'OAuth2',
            user: EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken
        }
    })

    let info = await transporter.sendMail({
        from: `"OTP Service E-Wastepas" ${EMAIL}`,
        to: email,
        subject: 'Your OTP Verification Code',
        text: `Your OTP code is: ${otp}`
    });

    console.log('Message sent: %s', info.messageId)
}


export const registration = async (req, res) => {
    const { email, password, confirm_password } = req.body

    if(!email || !password || !confirm_password){
        return res.status(400).json({error: 'Required fields are missing. Please complete all required fields.'})
    }

    if(password !== confirm_password){
        return res.status(400).json({error: 'Both passwords must be the same. Please check and re-enter.'})
    }

    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const passwordHash = bcrypt.hashSync(password, salt)

    try {
        const newUser = await prisma.users.create({
            data: {
                Email: email,
                Password: passwordHash,
                Roles: 'kurir'
            }
        })
        const otp = generatorOTP();
        try {
            await sendOTPEmail(email, otp)
            return res.status(201).json({ message: 'Registration successful.', data: newUser})
        } catch (error) {
            console.error(error)
            res.status(500).json({ error: 'Failed to send OTP email.' })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error })
    }

}

export const verifyOTP = async (req,res) => {
    const { email, otp } = req.body

    if(!otp){
        return res.status(400).json({error: 'OTP is required.'})
    }

    const tokenValidates = speakeasy.totp.verify({
        secret: SECRET_KEYS,
        encoding: 'base32',
        token: otp,
        step: 180,
        window:1
      })

    if(tokenValidates){
        try {
            await prisma.users.update({
                where: {
                    Email: email
                },
                data: {
                    is_verified: true
                }
            })
            return res.status(200).json({message: 'User has been verified.'})
        } catch (error) {
            console.error(error)
        }
    } else {
        return res.status(400).json({error: 'Invalid OTP'})
    }
    
}

export const login = async (req, res) => {
    const {email, password} = req.body

    const user = await prisma.users.findFirst({
        where: { Email: email }
    })

    if(!user){
        return res.status(400).json({error: "User not found"})
    }

    const match = await bcrypt.compare(password, user.Password);

    if(match){
        const payload = {
            id: user.id_user,
            email: user.Email,
            role: user.Roles
        }
        const expiresIn = 60 * 60 *6
        const token = jwt.sign(payload, SECRET_KEYS, {expiresIn: expiresIn})

        return res.status(200).json({message: 'Login successful', token: token, user: payload})
    } else {
        return res.status(400).json({error: 'Incorrect password'})
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.payload
    const { new_password, confirm_new_password } = req.body

    if(!new_password || !confirm_new_password) {
        return res.status(400).json({error: 'Required fields are missing. Please complete all required fields.'})
    }

    if(new_password !== confirm_new_password) {
        return res.status(400).json({error: 'Both passwords must be the same. Please check and re-enter.'})
    }

    try {
        await prisma.users.update({
            where: {
                Email: email
            },
            data: {
                Password: new_password
            }
        })
        return res.status(200).json({message: 'Change password succesfully.'})
    } catch (error) {
        console.log(error)
    }
}
