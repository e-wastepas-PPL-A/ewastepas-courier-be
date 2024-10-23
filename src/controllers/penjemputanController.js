import {prisma} from "../database.js";

export const getPermintaan = async (req, res) => {
    try {
        const permintaan = await prisma.penjemputan_sampah.findMany()
        res.json({ data: permintaan });
    } catch (e) {
        res.status(500).json({ error: "Error fetching Permintaan" });
    }
}

export const terimaPermintaan = async (req, res) => {
    const { id } = req.params;
    const {Status_Pengiriman} = req.body;
    try {
        const updatePermintaan = await prisma.penjemputan_sampah.update({
            where: {
                id_penjemputan: String(id)
            },
            data: {
                Status_Pengiriman
            }
        })
        res.json({data: updatePermintaan});
    } catch (e) {
        console.log(e)
    }
}

export const getHistory = async (req, res) => {
    const { id } = req.params;
    try {
        const history = await prisma.penjemputan_sampah.findMany({
            where: {
                Status_Penjemputan: {
                    equals: "Completed"
                },
                id_user: String(id)
            }
        })
        res.json({data: history})
    } catch (e) {
        console.log(e)
    }
};