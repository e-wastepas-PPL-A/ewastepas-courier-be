import { prisma } from '../database.js'
import bcrypt from 'bcrypt'

export const getUser = async (req, res) => {
    const {id} = req.payload

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
    const {name, address, nik, date_of_birth, phone_number, account_number} = req.body
    const id_payload = req.payload.id
    const id_params = parseInt(req.params.id, 10)
    const fotoPath = req.files?.foto ? req.files.foto[0].path.replace(/\\/g, '/') : null;
    const ktpPath = req.files?.ktp ? req.files.ktp[0].path.replace(/\\/g, '/') : null;
    const kkPath = req.files?.kk ? req.files.kk[0].path.replace(/\\/g, '/') : null;

    if ( id_params !== id_payload) {
        return res.status(403).json({error: "Forbidden Access"})
    }

    try {
        const updatedCourier = await prisma.courier.updateMany({
            where: {
                id_user: id_payload
            },
            data: {
                Nama: name,
                Alamat: address,
                NIK: nik,
                Tgl_Lahir: date_of_birth,
                No_Telp: phone_number,
                No_Rek: account_number,
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