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

const generateJWT = (payload, expiresIn) => {
    const token = jwt.sign(payload, SECRET_KEYS, {expiresIn: expiresIn})
    return token
}

const generatePassword = (password) => {
    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const passwordHash = bcrypt.hashSync(password, salt)
    return passwordHash
}

export const sendOTPEmail = async (email) => {
    const accessToken = await oAuth2Client.getAccessToken()
    const otp = generatorOTP()

    const transporter = nodemailer.createTransport({
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

    const info = await transporter.sendMail({
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

    const passwordHash = generatePassword(password)

    try {
        const newUser = await prisma.users.create({
            data: {
                Email: email,
                Password: passwordHash,
                Roles: 'kurir'
            }
        })
        
        await sendOTPEmail(email)

        return res.status(201).json({ message: 'Registration successful.', data: newUser})
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'An error occurred during login'})
    }

}

export const verifyOTP = async (req,res) => { 
    const {email, otp, type} = req.body

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

    if(!tokenValidates){
        return res.status(400).json({error: 'Invalid OTP'})
    }
    
    if(type === 'registration'){
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
    } else if (type === 'forgot_password') {
        const expiresIn = 5 * 60
        const payload = {email: email}
        const token = generateJWT(payload, expiresIn)

        return res.status(200).json({token: token})
    } else {
        return res.status(400).json({error: 'Invalid type'})
    }
    
}

export const login = async (req, res) => {
    const {email, password} = req.body

    try {
        const user = await prisma.users.findUnique({
            where: { Email: email }
        })
    
        if(!user){
            return res.status(404).json({error: "User not found"})
        }
    
        if(!user.is_verified){
            return res.status(403).json({
                error: "Your account has not been verified",
                email: email
            })
        }
    
        const match = await bcrypt.compare(password, user.Password);
    
        if(match){
            const payload = {
                id: user.id_user,
                email: user.Email,
                role: user.Roles
            }
            const expiresIn = 60 * 60 *6
            const token = generateJWT(payload, expiresIn)
            return res.status(200).json({message: 'Login successful', token: token, user: payload})
        } else {
            return res.status(400).json({error: 'Incorrect password'})
        } 
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: 'An error occurred during login'})
    }
}

export const forgotPassword = async (req, res) => {
    const {email} = req.payload
    const {new_password, confirm_new_password} = req.body

    if(!new_password || !confirm_new_password) {
        return res.status(400).json({error: 'Required fields are missing. Please complete all required fields.'})
    }

    if(new_password !== confirm_new_password) {
        return res.status(400).json({error: 'Both passwords must be the same. Please check and re-enter.'})
    }

    const passwordHash = generatePassword(new_password)

    try {
        await prisma.users.update({
            where: {
                Email: email
            },
            data: {
                Password: passwordHash
            }
        })

        return res.status(200).json({message: 'Change password succesfully.'})
    } catch (error) {
        console.log(error)
        return res.status(500).json({error: 'Change password failed.'})
    }
}

export const sendOTP = async (req, res) => {
    const {email} = req.body

    try {
        const user = await prisma.users.findUnique({
            where: {Email: email}
        })

        if(!user){
            return res.status(404).json({ error: 'User not found'})
        }

        await sendOTPEmail(email)
        
        return res.status(200).json({ message: 'OTP send to your email'})
    } catch(error){
        console.error(error)
        return res.status(500).json({error: 'Failed send OTP email'})
    }
}
