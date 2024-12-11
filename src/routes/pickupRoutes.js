import express from 'express';
import {
    updatePickupStatusToAccepted,
    getAllPickupRequest,
    getPickupRequestById,
    getPickupHistoryByCourier,
    getCalculatePickupTotals,
    updatePickupStatusToCancelled, updatePickupStatusToCompleted
} from '../controllers/pickupController.js';

// Input validation middleware
const validateIdParam = (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID parameter' });
    }
    req.validatedId = id;
    next();
};

// Query validation middleware
const validatePickupHistoryQuery = (req, res, next) => {
    const { page, limit, sortBy, order } = req.query;

    // Validate pagination
    if (page && (!Number.isInteger(+page) || +page < 1)) {
        return res.status(400).json({ error: 'Invalid page number' });
    }
    if (limit && (!Number.isInteger(+limit) || +limit < 1)) {
        return res.status(400).json({ error: 'Invalid limit number' });
    }

    // Validate sorting
    const allowedSortFields = ['pickup_date', 'pickup_status', 'pickup_address'];
    if (sortBy && !allowedSortFields.includes(sortBy)) {
        return res.status(400).json({ error: 'Invalid sort field' });
    }
    if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
        return res.status(400).json({ error: 'Invalid sort order' });
    }

    next();
};

const router = express.Router();

// Group routes by resource and action
// Pickup requests
router.get(
    '/pickup',
    getAllPickupRequest
);

router.get(
    '/pickup/:id',
    validateIdParam,
    getPickupRequestById
);

// Status updates
router.patch(
    '/pickup/:id/accept',
    validateIdParam,
    updatePickupStatusToAccepted
);

router.patch(
    '/pickup/:id/cancel',
    validateIdParam,
    updatePickupStatusToCancelled
);

router.patch(
    '/pickup/:id/complete',
    validateIdParam,
    updatePickupStatusToCompleted
);

// Courier-specific routes
router.get(
    '/pickup/courier/history',
    validatePickupHistoryQuery,
    getPickupHistoryByCourier
);

router.get(
    '/pickup/courier/:id/totals',
    [
        validateIdParam,
    ],
    getCalculatePickupTotals
);

export default router;