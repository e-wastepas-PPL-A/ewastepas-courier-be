import express from 'express';
import {
    findWasteName,
    getWasteById,
    getAllWasteTypes,
    getWasteLists,
    withCache,
    getWasteTypeById,
} from '../controllers/wasteController.js';

const router = express.Router();

// Validation middleware
const validatePaginationQuery = (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (!Number.isInteger(+page) || +page < 1)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid page number. Must be a positive integer.',
        });
    }

    if (limit && (!Number.isInteger(+limit) || +limit < 1 || +limit > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid limit. Must be between 1 and 100.',
        });
    }

    next();
};

const validateSearchQuery = (req, res, next) => {
    const { name } = req.query;

    if (!name || name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Search query must be at least 2 characters long.',
        });
    }

    // Sanitize the search query
    req.query.name = name.trim();
    next();
};

const validateIdParam = (req, res, next) => {
    const { id } = req.params;

    if (!Number.isInteger(+id) || +id < 1) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID. Must be a positive integer.',
        });
    }

    next();
};

// Waste-related routes
router
    .route('/waste')
    .get(validatePaginationQuery, withCache('waste'), getWasteLists);

router
    .route('/waste/search')
    .get(validateSearchQuery, findWasteName);

router
    .route('/waste/types')
    .get(withCache('waste-types', 3600), getAllWasteTypes);

// Define the more specific route first
router
    .route('/waste/:id/details')
    .get(validateIdParam, getWasteById);

// Define the less specific route after
router
    .route('/waste/:id')
    .get(validateIdParam, getWasteTypeById);

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