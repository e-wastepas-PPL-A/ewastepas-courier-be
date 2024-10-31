import { prisma } from "../database.js";

export const getWasteTypes = async (req, res) => {
    try {
        const wasteTypes = await prisma.waste_type.findMany();
        res.json({ data: wasteTypes });
    } catch (error) {
        console.error("Error fetching waste types:", error);
        res.status(500).json({ error: "An error occurred while fetching waste types" });
    }
}

export const getTotalWaste = async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID format" });
    }

    try {
        const totalWaste = await prisma.users.findUnique({
            where: {
                user_id: userId,
            },
            select: {
                waste_total: true,
            }
        });

        if (!totalWaste) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ data: totalWaste });
    } catch (error) {
        console.error("Error fetching total waste:", error);
        res.status(500).json({ error: "An error occurred while fetching total waste" });
    }
}