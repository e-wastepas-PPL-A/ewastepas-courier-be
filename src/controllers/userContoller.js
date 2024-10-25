import { prisma } from '../database.js'
import bcrypt from 'bcrypt'

export const getAllUsers = async (req, res) => {
    try {
        const allUsers = await prisma.users.findMany();
        res.status(200).json({allUsers})
    } catch (error) {
        console.log(error)
        res.status(500).json({error: error})
    }
}

export const updateUserData = async (req, res) => {
    const { id, email, nama, alamat, nik, tgl_lahir, no_telp, no_rek } = req.body
    
    const ktpPath = req.files['ktp'][0].path.replace(/\\/g, '/')
    const kkPath = req.files['kk'][0].path.replace(/\\/g, '/')
    const fotoPath = req.files['foto'][0].path.replace(/\\/g, '/')

    try {
        const updatedUser = await prisma.users.updateMany({
            where: {
                id_user: id
            },
            data: {
                Email: email,
                Nama: nama,
                Alamat: alamat,
                NIK: nik,
                Tgl_Lahir: tgl_lahir,
                No_Telp: no_telp,
                No_Rek: no_rek,
                Foto: fotoPath,
                KTP_URL: ktpPath,
                KK_URL: kkPath
            }
        })
        res.status(200).json({message: 'Data successfully updated', data: updatedUser})  
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error}) 
    }

}

export const changePassword = async (req, res) => {
    const { email, old_password, password, password2 } = req.body

    if(password !== password2){
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
    const passwordHash = bcrypt.hashSync(password, salt)

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
        return res.status(500).json({message: 'Change password failed.'})
    }
}