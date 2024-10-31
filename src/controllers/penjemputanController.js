import { prisma } from "../database.js";
import * as yup from "yup";

const acceptPickupRequestSchema = yup.object().shape({
    pickup_status: yup.string().required("Pickup status is required"),
});

const getPickupHistorySchema = yup.object().shape({
    id: yup.number().required("User ID is required").positive().integer(),
});

export const getPickupRequests = async (req, res) => {
    try {
        const pickups = await prisma.pickup_waste.findMany();
        res.json({ data: pickups });
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
            where: { pickup_id: pickupId },
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
    const { id } = req.params;

    try {
        // Validate request parameters
        await getPickupHistorySchema.validate({ id: parseInt(id, 10) });

        const userId = parseInt(id, 10);

        const history = await prisma.pickup_waste.findMany({
            where: {
                pickup_status: "completed",
                user_id: userId,
            },
        });

        if (history.length === 0) {
            return res.status(404).json({ error: "No completed pickups found for this user" });
        }

        res.json({ data: history });
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            return res.status(400).json({ error: error.message });
        }
        console.error("Error fetching pickup history:", error);
        res.status(500).json({ error: "An error occurred while fetching pickup history" });
    }
};