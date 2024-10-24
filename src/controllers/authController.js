import 'dotenv/config'
import speakeasy from 'speakeasy'
import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { prisma } from '../database.js'
import { json } from 'express'
import bcrypt from 'bcrypt'


const {EMAIL,SECRET_KEYS,CLIENT_ID,CLIENT_SECRET,REDIRECT_URL,REFRESH_TOKEN} = process.env

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URL)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

const generatorOTP = () => {
    const otp = speakeasy.totp({
        secret: SECRET_KEYS,
        encoding: 'base32',
        step: 300
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

    if(!req.body.email || !req.body.password || !req.body.password2){
        return res.status(400).json({error: 'Required fields are missing. Please complete all required fields.'})
    }

    if(req.body.password !== req.body.password2){
        return res.status(400).json({error: 'Both passwords must be the same. Please check and re-enter.'})
    }

    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const passwordHash = bcrypt.hashSync(req.body.password, salt)

    try {
        const newUser = await prisma.users.create({
            data: {
                id_user: req.body.id,
                Email: req.body.email,
                Password: passwordHash
            }
        })
        res.status(200).json({ message: 'Registration successful.', data: newUser})
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error })
    }

    const otp = generatorOTP();

    try {
        await sendOTPEmail(req.body.email, otp)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to send OTP email.' })
    }

}


export const verifyOTP = async (req,res) => {

    if(!req.body.otp){
        return res.status(400).json({error: 'OTP is required.'})
    }

    const tokenValidates = speakeasy.totp.verify({
        secret: SECRET_KEYS,
        encoding: 'base32',
        token: req.body.otp,
        step: 300,
        window:1
      })

    if(tokenValidates){
        try {
            await prisma.users.update({
                where: {
                    id_user: req.body.id
                },
                data: {
                    Is_verified : 1
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
    res.json({message: 'ini login'})
}
