import { prisma } from "../database.js";

const getAllWaste = async (req, res) => {
    try {
        const {id} = req.params;
        const wasteTypeId = parseInt(id, 10)

        const waste = await prisma.waste.findMany({
            where:{
                waste_type_id:wasteTypeId
            },
            include: {
                waste_type: true
            }

        })
        res.json({data : waste})
    } catch (error) {
        console.error("Error fetching waste:", error);
        res.status(500).json({ error: "An error occurred while fetching waste" });
    }
};

const getWasteLists = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const wasteData = await prisma.waste.findMany({
            skip: offset,
            take: parseInt(limit, 10),
            select: {
                waste_id: true,
                waste_type_id: true,
                waste_name: true,
                image: true,
                description: true,
            },
        });

        const totalWasteCount = await prisma.waste.count();

        res.json({
            data: wasteData,
            pagination: {
                total: totalWasteCount,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(totalWasteCount / limit),
            },
        });
    } catch (error) {
        return res
            .status(400)
            .json({ error: "An error occurred while fetching paginated waste list" });
    }
};

const findWasteName = async (req, res) => {
    try {
        const wasteName = req.query.name;

        console.log(wasteName)

        const waste = await prisma.waste.findMany({
            where: {
                waste_name: {
                    contains: wasteName,
                }
            }
        })

        res.status(200).json({
            data: waste,
        })
    } catch (e) {
        console.error(e)
    }
}

export {
    getAllWaste,
    getWasteLists,
    findWasteName
};