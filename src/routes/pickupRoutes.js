import express from 'express';
import {
    updatePickupStatusToAccepted,
    getAllPickupRequest,
    getPickupRequestById,
    getPickupHistoryByCourier,
    getCalculatePickupTotals,
    updatePickupStatusToCancelled,
    updatePickupStatusToCompleted,
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

// Pickup requests
router
    .route('/pickup')
    .get(getAllPickupRequest);

router
    .route('/pickup/:id')
    .get(validateIdParam, getPickupRequestById);

// Status updates
router
    .route('/pickup/:id/accept')
    .patch(validateIdParam, updatePickupStatusToAccepted);

router
    .route('/pickup/:id/cancel')
    .patch(validateIdParam, updatePickupStatusToCancelled);

router
    .route('/pickup/:id/complete')
    .patch(validateIdParam, updatePickupStatusToCompleted);

// Courier-specific routes
router
    .route('/pickup/courier/history')
    .get(validatePickupHistoryQuery, getPickupHistoryByCourier);

router
    .route('/pickup/courier/:id/totals')
    .get(validateIdParam, getCalculatePickupTotals);

// Error handling middleware (must be placed after all routes)
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default router;