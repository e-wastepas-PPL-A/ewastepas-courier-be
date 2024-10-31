import { prisma } from "../database.js";
import * as yup from "yup";

const acceptPickupRequestSchema = yup.object().shape({
    pickup_status: yup.string().required("Pickup status is required"),
});

const calculatePickupTotals = async (userId) => {
    const totalDelivered = await prisma.pickup_waste.count({
        where: { pickup_status: "accepted" }
    });
    const totalOnDelivery = await prisma.pickup_waste.count({
        where: { pickup_status: "pending" }
    });
    const totalCanceled = await prisma.pickup_waste.count({
        where: { pickup_status: "denied" }
    });
    const totalPoints = await prisma.users.findUnique({
        where: {
            user_id: userId
        },
        select: {
            waste_total: true,
        }
    })

    return { totalDelivered, totalOnDelivery, totalCanceled, totalPoints };
}

export const getPickupRequests = async (req, res) => {
    try {
        const userId = req.users.user_id;

        const pickups = await prisma.pickup_waste.findMany({
            where: {user_id: userId}
        });

        const totals = await calculatePickupTotals(userId)

        res.json({
            data: pickups,
            totals
        });

    } catch (error) {
        console.error("Error fetching pickup requests:", error);
        res.status(500).json({ error: "An error occurred while fetching pickup requests" });
    }
};

export const acceptPickupRequest = async (req, res) => {
    const { id } = req.params;
    const pickupId = parseInt(id, 10);

    if (isNaN(pickupId)) {
        return res.status(400).json({ error: "Invalid pickup ID format" });
    }

    try {
        // Validate request body
        await acceptPickupRequestSchema.validate(req.body);

        const { pickup_status } = req.body;

        const updatedRequest = await prisma.pickup_waste.update({
            where: { pickup_id: pickupId, user_id: req.users.user_id },
            data: { pickup_status },
        });

        if (!updatedRequest) {
            return res.status(404).json({ error: "Pickup request not found" });
        }

        res.json({ data: updatedRequest });
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error("Error updating pickup request status:", error);
        res.status(500).json({ error: "An error occurred while updating pickup request status" });
    }
};

export const getPickupHistory = async (req, res) => {
    try {
        const userId = req.users.user_id;
        const history = await prisma.pickup_waste.findMany({
            where: {
                pickup_status: "completed",
                user_id: req.users.user_id,
            },
        });

        if (history.length === 0) {
            return res.status(404).json({ error: "No completed pickups found for this user" });
        }

        res.json({
            data: history,
        });
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error("Error fetching pickup history:", error);
        res.status(500).json({ error: "An error occurred while fetching pickup history" });
    }
};
