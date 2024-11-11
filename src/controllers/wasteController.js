import { prisma } from "../database.js";

// Common response formats
const ApiResponse = {
    success: (data, message = 'Success') => ({
        success: true,
        message,
        data
    }),
    error: (message = 'Internal server error', status = 500) => ({
        success: false,
        message,
        status
    })
};

// Validation helpers
const validatePagination = (page = 1, limit = 10) => ({
    page: Math.max(1, parseInt(page, 10)),
    limit: Math.min(100, Math.max(1, parseInt(limit, 10))), // Prevent excessive limit values
    skip: (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10)
});

const validateId = (id) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed <= 0) {
        throw new Error('Invalid ID provided');
    }
    return parsed;
};

// Error handler wrapper
const asyncHandler = (handler) => async (req, res) => {
    try {
        await handler(req, res);
    } catch (error) {
        console.error(`Error in ${handler.name}:`, error);
        const response = ApiResponse.error(
            error.message || 'An unexpected error occurred',
            error.status || 500
        );
        res.status(response.status).json(response);
    }
};

// Constants for common selections
const WASTE_TYPE_SELECT = {
    waste_type_id: true,
    waste_type_name: true,
    image: true,
};

const WASTE_SELECT = {
    waste_id: true,
    waste_name: true,
    image: true,
    description: true,
    waste_type_id: true,
};

// Controller functions
export const getAllWasteTypes = asyncHandler(async (req, res) => {
    const wasteTypes = await prisma.waste_type.findMany({
        select: WASTE_TYPE_SELECT,
        orderBy: { waste_type_name: 'asc' },
    });

    if (!wasteTypes.length) {
        const response = ApiResponse.error('No waste types found.', 404);
        return res.status(404).json(response);
    }

    res.json(ApiResponse.success(wasteTypes));
});

export const getWasteById = asyncHandler(async (req, res) => {
    const wasteTypeId = validateId(req.params.id);

    const waste = await prisma.waste.findMany({
        where: { waste_type_id: wasteTypeId },
        select: {
            ...WASTE_SELECT,
            waste_type: {
                select: WASTE_TYPE_SELECT
            }
        },
        orderBy: { waste_name: 'asc' }
    });

    if (!waste.length) {
        const response = ApiResponse.error('No waste found for the given ID.', 404);
        return res.status(404).json(response);
    }

    res.json(ApiResponse.success(waste));
});

export const getWasteLists = asyncHandler(async (req, res) => {
    const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);
    const search = req.query.search?.trim();

    // Build where clause conditionally
    const where = search ? {
        waste_name: {
            contains: search,
            mode: 'insensitive'
        }
    } : undefined;

    // Execute queries in parallel
    const [wasteData, totalWasteCount] = await Promise.all([
        prisma.waste.findMany({
            where,
            skip,
            take: limit,
            select: WASTE_SELECT,
            orderBy: { waste_name: 'asc' }
        }),
        prisma.waste.count({ where })
    ]);

    const pagination = {
        total: totalWasteCount,
        page,
        limit,
        totalPages: Math.ceil(totalWasteCount / limit)
    };

    res.json(ApiResponse.success({
        items: wasteData,
        pagination
    }));
});

export const findWasteName = asyncHandler(async (req, res) => {
    const name = req.query.name?.trim();

    if (!name) {
        const response = ApiResponse.error('Waste name is required.', 400);
        return res.status(400).json(response);
    }

    const waste = await prisma.waste.findMany({
        where: {
            waste_name: {
                contains: name,
            }
        },
        select: WASTE_SELECT,
        orderBy: { waste_name: 'asc' },
        take: 50
    });

    if (!waste.length) {
        const response = ApiResponse.error('No waste found with the given name.', 404);
        return res.status(404).json(response);
    }

    res.json(ApiResponse.success(waste));
});

const cache = {
    get: async (key) => null,
    set: async (key, value, ttl) => null
};

export const withCache = (key, ttl = 3600) => async (req, res, next) => {
    try {
        const cached = await cache.get(key);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        next();
    } catch (error) {
        next(error);
    }
};