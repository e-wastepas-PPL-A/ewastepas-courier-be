import { prisma } from "../database.js";

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

const acceptPickupRequest = async (req, res) => {
    const {id} = req.params;
    const pickupId = parseInt(id, 10)

    if (isNaN(pickupId)) {
        return res.status(400).json({ error: "Invalid pickup ID format" });
    }

    try {
        await acceptPickupRequestSchema.validate(req.body);

        const { pickup_status } = req.body;

        const pickupReq = await prisma.pickup_waste.update({
            where: { pickup_id: pickupId, user_id: req.users.user_id },
            data: { pickup_status },
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
    acceptPickupRequest
}