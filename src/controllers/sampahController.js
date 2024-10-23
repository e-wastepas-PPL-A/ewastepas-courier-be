import {prisma} from "../database.js";

export const getJenisSampah = async (req, res) => {
    try {
        const jenisSampah = await prisma.jenis_sampah.findMany();
        res.json({ data: jenisSampah });
    } catch (error) {
        res.status(500).json({ error: "Error fetching jenis sampah" });
    }
}

export const getTotalSampah = async (req, res) => {
    const { id } = req.params;
    try {
        const totalSampah = await prisma.users.findUnique({
            where: {
                id_user: String(id),
            },
            select: {
                Berat_Sampah: true,
            }
        });
        console.log(id);
        res.json({ data: totalSampah });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Error fetching total sampah" });
    }
}