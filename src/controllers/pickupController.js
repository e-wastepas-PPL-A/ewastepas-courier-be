import { prisma } from "../database.js";
import yup from "yup";

const acceptPickupRequestSchema = yup.object().shape({
    pickup_status: yup.string().required("Pickup status is required"),
});

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

// Temporary
const getPickupRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const pickUpId = parseInt(id, 10);

        const pickup = await prisma.$queryRawUnsafe(`SELECT * FROM vw_pickup_waste WHERE pickup_id = ${pickUpId}`);

        if (pickup.length === 0) {
            return res.status(404).json({ message: 'No pickup found for the given ID.' });
        }

        res.status(200).json({data: pickup});
    } catch (e) {
        console.error(e)
        return res.status(500).json({error: e});
    }
}

const getCalculatePickupTotals = async (req, res) => {
    const today = new Date();
    const { id } = req.params;
    const year = today.getFullYear();
    const monthlyData = [];
    console.log(today)
    try {
        const courierId = parseInt(id, 10);
        const totalDelivered = await prisma.pickup_waste.count({
            where: {
                pickup_status: "accepted",
                courier_id: courierId,
                updated_at: { gte: today }
            }
        });

        const totalOnDelivery = await prisma.pickup_waste.count({
            where: {
                pickup_status: "pending",
                courier_id: courierId,
                updated_at: { gte: today }
            }
        });

        const totalCanceled = await prisma.pickup_waste.count({
            where: {
                pickup_status: "cancelled",
                courier_id: courierId,
                updated_at: { gte: today }
            }
        });

        const totalPoints = await prisma.courier_points.findFirst({
            where: {
                courier_id: courierId,
                updated_at: { gte: today }
            },
            select: {
                total_points: true,
            }
        });
        for (let month = 0; month < 12; month++) {
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 1);

            const totalMonthDelivered = await prisma.pickup_waste.count({
                where: {
                    pickup_status: "accepted",
                    courier_id: courierId,
                    created_at: {
                        gte: startOfMonth,
                        lt: endOfMonth
                    }
                }
            });

            monthlyData.push({
                month: month + 1,
                totalDelivered: totalMonthDelivered,
            });
        }

        res.json({
            todayTotals: {
                totalDelivered,
                totalOnDelivery,
                totalCanceled,
                totalPoints: totalPoints ? totalPoints.total_points : 0
            },
            monthlyTotals: monthlyData
        });
    } catch (error) {
        console.error("Error fetching calculate pickup:", error);
        res.status(500).json({ error: "An error occurred while fetching calculate pickup" });
    }
}

const acceptPickupRequest = async (req, res) => {
    const {id} = req.params;
    const pickupId = parseInt(id, 10)

    if (isNaN(pickupId)) {
        return res.status(400).json({ error: "Invalid pickup ID format" });
    }

    try {
        await acceptPickupRequestSchema.validate(req.body);

        const { pickup_status, courier_id } = req.body;

        const pickupReq = await prisma.pickup_waste.update({
            where: {
                pickup_id: pickupId
            },
            data: {
                pickup_status: pickup_status,
                courier_id: courier_id
            },
        });

        if (!updatedRequest) {
            return res.status(404).json({ error: "Pickup request not found" });
        }

        return res
            .status(200)
            .json({data: pickupReq});

    } catch (e) {
        return res.status(500).json({error: "Action error", e});
    }
}

export {
    getAllPickupRequest,
    acceptPickupRequest,
    getPickupRequestById,
    getCalculatePickupTotals
}