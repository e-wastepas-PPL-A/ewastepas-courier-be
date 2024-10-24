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
    const {id, email, nama, alamat, nik, tgl_lahir, no_telp, no_rek} = req.body
    
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
    res.json({message: 'ini lupa password'})
}