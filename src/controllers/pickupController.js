import { prisma } from "../database.js";
import {logger} from "../utils/logger.js";

// Constants
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

// Enums for better type safety and maintainability
const PickupStatus = {
    ACCEPTED: 'accepted',
    REQUESTED: 'requested',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
};

const SortableFields = {
    PICKUP_DATE: 'pickup_date',
    PICKUP_STATUS: 'pickup_status',
    PICKUP_ADDRESS: 'pickup_address'
};

// Validation schemas
const ValidationRules = {
    ALLOWED_SORT_FIELDS: Object.values(SortableFields),
    ALLOWED_SORT_ORDERS: ['asc', 'desc']
};

// Error definitions
class AppError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const ErrorTypes = {
    INVALID_ID: (type) => new AppError(400, `Invalid ${type} ID`),
    NOT_FOUND: (type) => new AppError(404, `No ${type} found for the given ID`),
    INVALID_SORT: () => new AppError(400, 'Invalid sort parameters'),
    SERVER_ERROR: (message) => new AppError(500, message || 'Internal server error')
};

// Utility functions
const validateId = (id, type = 'pickup') => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
        throw ErrorTypes.INVALID_ID(type);
    }
    return parsedId;
};

const validateSortParams = (sortBy, order) => {
    if (!ValidationRules.ALLOWED_SORT_FIELDS.includes(sortBy) ||
        !ValidationRules.ALLOWED_SORT_ORDERS.includes(order.toLowerCase())) {
        throw ErrorTypes.INVALID_SORT();
    }
    return { sortBy, order: order.toLowerCase() };
};

const handleResponse = async (res, asyncFn) => {
    try {
        const result = await asyncFn();
        return res.status(200).json(result);
    } catch (error) {
        logger.error(`Error in request: ${error.message}`, {
            stack: error.stack,
            status: error.status
        });
        const status = error.status || 500;
        const message = error.message || 'Internal server error';
        return res.status(status).json({ error: message });
    }
};

// Service layer for business logic
class PickupService {
    static async calculateTotals(courierId, timeFrame = 'day') {
        const now = new Date();
        let startDate;

        switch (timeFrame) {
            case 'day':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 1);
                break;
            default:
                throw new Error('Invalid time frame');
        }

        const statuses = [
            { status: 'ACCEPTED', field: 'totalDelivered' },
            { status: 'REQUESTED', field: 'totalOnDelivery' },
            { status: 'COMPLETED', field: 'totalCompleted' },
            { status: 'CANCELLED', field: 'totalCancelled' }
        ];

        const totals = {};

        for (const { status, field } of statuses) {
            totals[field] = await prisma.pickup_waste.count({
                where: {
                    courier_id: courierId,
                    pickup_status: status.toLowerCase(),
                    created_at: { gte: startDate }
                }
            });
        }

        return {
            timeFrame,
            ...totals,
            startDate
        };
    }

    static async getDetailedPickupTotals(courierId) {
        return {
            day: await this.calculateTotals(courierId, 'day'),
            week: await this.calculateTotals(courierId, 'week'),
            month: await this.calculateTotals(courierId, 'month'),
            year: await this.calculateTotals(courierId, 'year'),
        };
    }
}

// Controller functions
export const getAllPickupRequest = async (req, res) =>
    handleResponse(res, async () => {
        const {
            status,
            startDate,
            endDate,
            search,
            sortBy = SortableFields.PICKUP_DATE,
            order = 'desc',
            page = DEFAULT_PAGE.toString(),
            limit = DEFAULT_PAGE_SIZE.toString()
        } = req.query;

        const { sortBy: validatedSortBy, order: validatedOrder } =
            validateSortParams(sortBy, order);

        const pagination = {
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10)
        };

        const filters = {
            ...(status && { pickup_status: status }),
            ...(search && { pickup_address: { contains: search } }),
            ...(startDate && endDate && {
                pickup_date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            })
        };

        const [historyData, totalCount] = await Promise.all([
            prisma.pickup_waste.findMany({
                where: filters,
                orderBy: { [validatedSortBy]: validatedOrder },
                ...pagination,
                select: {
                    pickup_id: true,
                    pickup_date: true,
                    pickup_address: true,
                    pickup_status: true,
                    dropbox: {
                        select: {
                            name: true,
                            address: true
                        }
                    },
                    community: {
                        select: {
                            name: true,
                            phone: true
                        }
                    },
                    courier: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            }),
            prisma.pickup_waste.count({ where: filters })
        ]);

        return {
            data: historyData,
            total: totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pagination.take)
        };
    });

export const getPickupRequestById = async (req, res) =>
    handleResponse(res, async () => ({
        data: await PickupService.getPickupById(validateId(req.params.id))
    }));

export const updatePickupStatus = async (req, res, status) =>
    handleResponse(res, async () => {
        const updatedPickup = await PickupService.updateStatus(
            validateId(req.params.id),
            status
        );
        return {
            message: `Pickup status updated to ${status}`,
            data: updatedPickup
        };
    });

export const updatePickupStatusToAccepted = (req, res) =>
    updatePickupStatus(req, res, PickupStatus.ACCEPTED);

export const updatePickupStatusToCancelled = (req, res) =>
    updatePickupStatus(req, res, PickupStatus.CANCELLED);

export const updatePickupStatusToCompleted = (req, res) =>
    updatePickupStatus(req, res, PickupStatus.COMPLETED);

export const getCalculatePickupTotals = async (req, res) =>
    handleResponse(res, async () => {
        const courierId = validateId(req.params.id, 'courier');

        try {
            const totals = await PickupService.getDetailedPickupTotals(courierId);

            logger.info(`Pickup totals calculated for Courier ID: ${courierId}`, {
                day: totals.day,
                week: totals.week,
                month: totals.month,
                year: totals.year,
            });

            return { totals };
        } catch (error) {
            logger.error(`Error calculating pickup totals: ${error.message}`, {
                courierId,
                stack: error.stack
            });
            throw error;
        }
    });

export const getPickupHistoryByCourier = async (req, res) =>
    handleResponse(res, async () => {
        const {
            courierId,
            status,
            startDate,
            endDate,
            search,
            sortBy = SortableFields.PICKUP_DATE,
            order = 'desc',
            page = DEFAULT_PAGE.toString(),
            limit = DEFAULT_PAGE_SIZE.toString()
        } = req.query;

        const { sortBy: validatedSortBy, order: validatedOrder } =
            validateSortParams(sortBy, order);

        const pagination = {
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10)
        };

        const filters = {
            ...(courierId && { courier_id: parseInt(courierId, 10) }),
            ...(status && { pickup_status: status }),
            ...(search && { pickup_address: { contains: search } }),
            ...(startDate && endDate && {
                pickup_date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            })
        };

        const [historyData, totalCount] = await Promise.all([
            prisma.pickup_waste.findMany({
                where: filters,
                orderBy: { [validatedSortBy]: validatedOrder },
                ...pagination,
                select: {
                    pickup_id: true,
                    pickup_date: true,
                    pickup_address: true,
                    pickup_status: true,
                    dropbox: {
                        select: {
                            name: true,
                            address: true
                        }
                    },
                    community: {
                        select: {
                            name: true,
                            phone: true
                        }
                    },
                    courier: {
                        select: {
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            }),
            prisma.pickup_waste.count({ where: filters })
        ]);

        return {
            data: historyData,
            total: totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pagination.take)
        };
    });
