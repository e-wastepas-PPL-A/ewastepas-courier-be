import 'dotenv/config'
import speakeasy from 'speakeasy'
import nodemailer from 'nodemailer'
import {google} from 'googleapis'

const {EMAIL,SECRET_KEYS,CLIENT_ID,CLIENT_SECRET,REDIRECT_URL,REFRESH_TOKEN} = process.env

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URL)
oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN})

const generatorOTP = () => {
    const otp = speakeasy.totp({
        secret: SECRET_KEYS,
        encoding: 'base32',
        // step: 120
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

const verifyOTP = (otp) => {
    var tokenValidates = speakeasy.totp.verify({
        secret: SECRET_KEYS,
        encoding: 'base32',
        token: otp,
        window:1
      })
    return tokenValidates
}

export const helloAuth = (req,res) => {
    return res.status(200).json({message: 'this auth'})
}

export const generateOTP = async (req,res) => {
    const { email } = req.body
    if (!email) {
        return res.status(400).json({ error: 'Email is required' })
    }

    const otp = generatorOTP();
    try {
        await sendOTPEmail(email, otp)
        res.json({ message: 'OTP sent to your email' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Failed to send OTP email' })
    }
}

export const verify = (req,res) => {
    const {otp} = req.body;
    if(!otp){
        return res.status(400).json({error: 'OTP is required'})
    }

    var checkOTP = verifyOTP(otp)

    // if(!checkOTP){
    //     return res.status(400).json({message: 'Invalid OTP'})
    // }
    
    return res.status(200).json({message: checkOTP})
}

