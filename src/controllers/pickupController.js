import { prisma } from "../database.js";

const getAllPickupRequest = async (req, res) => {
    try {
        const pickupReq = await prisma.pickup_waste.findMany()

        return res
            .status(200)
            .json({data: pickupReq});
    } catch (e) {
        return res.status(500).json({error: e});
    }
}

const getPickupRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pickUpId = parseInt(id, 10);

        if (isNaN(pickUpId)) {
            return res.status(400).json({ error: "Invalid pickup ID" });
        }

        const pickup = await prisma.pickup_waste.findUnique({
            where: { pickup_id: pickUpId },
        });

        if (!pickup) {
            return res.status(404).json({ message: 'No pickup found for the given ID.' });
        }

        res.status(200).json({ data: pickup });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e });
    }
};

const updatePickupStatusToAccepted = async (req, res) => {
    try {
        const { id } = req.params;
        const pickUpId = parseInt(id, 10);

        if (isNaN(pickUpId)) {
            return res.status(400).json({ error: "Invalid pickup ID" });
        }

        const updatedPickup = await prisma.pickup_waste.update({
            where: { pickup_id: pickUpId },
            data: { pickup_status: 'accepted' },
        });

        res.status(200).json({ message: 'Pickup status updated to success', data: updatedPickup });
    } catch (error) {
        console.error("Error updating pickup status:", error);
        return res.status(500).json({ error: "Failed to update pickup status" });
    }
};

const getCalculatePickupTotals = async (req, res) => {
    const today = new Date();
    const { id } = req.params;
    const year = today.getFullYear();

    try {
        const courierId = parseInt(id, 10);
        if (isNaN(courierId)) {
            return res.status(400).json({ error: "Invalid courier ID" });
        }

        const [totalDelivered, totalOnDelivery, totalCanceled, totalPoints] = await Promise.all([
            prisma.pickup_waste.count({
                where: {
                    pickup_status: "accepted",
                    courier_id: courierId,
                    updated_at: { gte: today },
                },
            }),
            prisma.pickup_waste.count({
                where: {
                    pickup_status: "pending",
                    courier_id: courierId,
                    updated_at: { gte: today },
                },
            }),
            prisma.pickup_waste.count({
                where: {
                    pickup_status: "cancelled",
                    courier_id: courierId,
                    updated_at: { gte: today },
                },
            }),
            prisma.courier_points.findFirst({
                where: { courier_id: courierId, updated_at: { gte: today } },
                select: { total_points: true },
            }),
        ]);

        const monthlyData = await Promise.all(
            Array.from({ length: 12 }, async (_, month) => {
                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 1);

                const totalMonthDelivered = await prisma.pickup_waste.count({
                    where: {
                        pickup_status: "accepted",
                        courier_id: courierId,
                        created_at: { gte: startOfMonth, lt: endOfMonth },
                    },
                });

                return {
                    month: month + 1,
                    totalDelivered: totalMonthDelivered,
                };
            })
        );

        res.json({
            todayTotals: {
                totalDelivered,
                totalOnDelivery,
                totalCanceled,
                totalPoints: totalPoints ? totalPoints.total_points : 0,
            },
            monthlyTotals: monthlyData,
        });
    } catch (error) {
        console.error("Error fetching calculate pickup:", error);
        res.status(500).json({ error: "An error occurred while fetching calculate pickup" });
    }
};

export {
    getAllPickupRequest,
    getPickupRequestById,
    getCalculatePickupTotals,
    updatePickupStatusToAccepted
}