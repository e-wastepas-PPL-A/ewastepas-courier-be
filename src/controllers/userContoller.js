import { prisma } from '../database.js'
import bcrypt from 'bcrypt'

export const getUser = async (req, res) => {
    const { id } = req.payload

    try {
        const user = await prisma.users.findUnique({
            where: {
                id_user: id
            }
        });
        res.status(200).json({user})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error})
    }
}

export const updateUserData = async (req, res) => {
    const {nama, alamat, nik, tgl_lahir, no_telp, no_rek} = req.body
    const {id, email} = req.payload
    const ktp = req.files['ktp'][0].path.replace(/\\/g, '/')
    const kk = req.files['kk'][0].path.replace(/\\/g, '/')
    const foto = req.files['foto'][0].path.replace(/\\/g, '/')

    try {
        const updatedUser = await prisma.users.updateMany({
            where: {
                id_user: id
            },
            data: {
                Nama: nama,
                Alamat: alamat,
                NIK: nik,
                Tgl_Lahir: tgl_lahir,
                No_Telp: no_telp,
                No_Rek: no_rek,
                Foto: foto,
                KTP_URL: ktp,
                KK_URL: kk
            }
        })
        res.status(200).json({message: 'Data successfully updated', data: updatedUser})  
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

    const user = await prisma.users.findFirst({
        where: {
            Email: email
        }
    })

    const match = await bcrypt.compare(old_password, user.Password);

    const saltRounds = 10
    const salt = bcrypt.genSaltSync(saltRounds)
    const passwordHash = bcrypt.hashSync(new_password, salt)

    if(match){
        try {
            await prisma.users.update({
                where: {
                    Email: email
                },
                data: {
                    Password : passwordHash
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