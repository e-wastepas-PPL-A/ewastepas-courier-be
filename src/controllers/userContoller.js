import 'dotenv/config'
import { prisma } from '../database.js'
import bcrypt from 'bcrypt'

export const getUser = async (req, res) => {
    const {id} = req.payload

    try {
        const courier = await prisma.courier.findUnique({
            where: {
                courier_id: id
            }
        });
        res.status(200).json({courier})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error})
    }
}

export const updateUserData = async (req, res) => {
    const {SERVER_URL} = process.env
    const id_payload = req.payload.id

    const filterRequest = Object.keys(req.body).reduce((result, key) => {
        if (req.body[key]) { 
          result[key] = req.body[key];
        }
        return result;
      }, {});

    if(req.files){
        if (req.files.ktp){
            filterRequest.ktp_url = SERVER_URL+req.files.ktp[0].path.replace(/\\/g, '/')
        }
        if (req.files.kk){
            filterRequest.kk_url = SERVER_URL+req.files.kk[0].path.replace(/\\/g, '/')
        }
        if (req.files.photo){
            filterRequest.photo = SERVER_URL+req.files.photo[0].path.replace(/\\/g, '/')
        }
    }

    try {
        const updatedCourier = await prisma.courier.updateMany({
            where: {
                courier_id: id_payload
            },
            data: filterRequest
        })
        console.log(filterFiles)
        console.log(filterRequest)
        res.status(200).json({message: 'Data successfully updated', data: updatedCourier})

    } catch (error) {
        console.log(error);
        res.status(500).json({error: error}) 
    }

}

export const changePassword = async (req, res) => {
    const {old_password, new_password, confirm_new_password} = req.body
    const {email} = req.payload

    if(!old_password || !new_password || !confirm_new_password) {
        return res.status(400).json({error: 'Required fields are missing. Please complete all required fields.'})
    }

    if(new_password !== confirm_new_password){
        return res.status(400).json({ error: 'Both passwords must be the same. Please check and re-enter.' })
    }

    const courier = await prisma.courier.findUnique({
        where: {
            email: email
        }
    })

    const match = await bcrypt.compare(old_password, courier.password);

    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const passwordHash = bcrypt.hashSync(new_password, salt)

    if(match){
        try {
            await prisma.courier.update({
                where: {
                    email: email
                },
                data: {
                    password: passwordHash
                }
            })
            res.status(200).json({message: 'Change password successfully.'})
        } catch (error) {
            console.log(error)
        }
    } else {
        return res.status(500).json({message: 'Old password wrong'})
    }
}