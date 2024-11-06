import { prisma } from "../database.js";

const getAllWasteTypes = async (req, res) => {
    try {
        const wasteTypes = await prisma.waste_type.findMany({
            select: {
                waste_type_id: true,
                waste_type_name: true,
                image: true,
            }
        });

        if (wasteTypes.length === 0) {
            return res.status(404).json({ message: 'No waste types found.' });
        }

        res.status(200).json({ data: wasteTypes });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error occurred while fetching waste types.' });
    }
};

const getWasteById = async (req, res) => {
    try {
        const { id } = req.params;
        const wasteTypeId = parseInt(id, 10);

        const waste = await prisma.waste.findMany({
            where: { waste_type_id: wasteTypeId },
            select: {
                waste_id: true,
                waste_name: true,
                image: true,
                description: true,
                waste_type: {
                    select: {
                        waste_type_id: true,
                        waste_type_name: true,
                        image: true,
                    }
                }
            }
        });

        if (waste.length === 0) {
            return res.status(404).json({ message: 'No waste found for the given ID.' });
        }

        res.json({ data: waste });
    } catch (error) {
        console.error("Error fetching waste:", error);
        res.status(500).json({ message: "An error occurred while fetching waste" });
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
        console.error("Error fetching paginated waste list:", error);
        res.status(500).json({ message: "An error occurred while fetching paginated waste list" });
    }
};

const findWasteName = async (req, res) => {
    try {
        const wasteName = req.query.name;

        if (!wasteName) {
            return res.status(400).json({ message: 'Waste name is required.' });
        }

        const waste = await prisma.waste.findMany({
            where: {
                waste_name: {
                    contains: wasteName
                },
            },
        });

        if (waste.length === 0) {
            return res.status(404).json({ message: 'No waste found with the given name.' });
        }

        res.status(200).json({ data: waste });
    } catch (e) {
        console.error("Error searching for waste name:", e);
        res.status(500).json({ message: 'An error occurred while searching for waste name.' });
    }
};

export {
    getWasteById,
    getWasteLists,
    findWasteName,
    getAllWasteTypes
};