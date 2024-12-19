import {prisma} from "../database.js";
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
    SERVER_ERROR: (message) => new AppError(500, message || 'Internal server error'),
    VALIDATION_ERROR: (message) => new AppError(400, message)
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
    static #STATUSES = [
        { status: 'ACCEPTED', field: 'totalDelivered' },
        { status: 'REQUESTED', field: 'totalOnDelivery' },
        { status: 'COMPLETED', field: 'totalCompleted' },
        { status: 'CANCELLED', field: 'totalCancelled' }
    ];

    static async calculateTotals(courierId, options = {}) {
        const {
            timeFrame = 'day',
            startDate: customStartDate,
            endDate: customEndDate
        } = options;

        // Default time frame calculation if no custom dates provided
        let startDate = customStartDate;
        let endDate = customEndDate;

        if (!startDate || !endDate) {
            const now = new Date();
            switch (timeFrame) {
                case 'day':
                    startDate = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    break;
                case 'week':
                    startDate = startDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                    endDate = endDate || new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
                    break;
                case 'month':
                    startDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                case 'year':
                    startDate = startDate || new Date(now.getFullYear(), 0, 1);
                    endDate = endDate || new Date(now.getFullYear() + 1, 0, 1);
                    break;
                default:
                    throw new Error('Invalid time frame');
            }
        }

        // Use Promise.all for concurrent queries
        const totals = await Promise.all(
            this.#STATUSES.map(async ({ status, field }) => ({
                [field]: await prisma.pickup_waste.count({
                    where: {
                        courier_id: courierId,
                        pickup_status: status.toLowerCase(),
                        created_at: {
                            gte: startDate,
                            lt: endDate
                        }
                    }
                })
            }))
        );

        return {
            timeFrame,
            ...Object.assign({}, ...totals),
            startDate,
            endDate
        };
    }

    static async getDetailedPickupTotals(courierId, options = {}) {
        const baseOptions = { ...options };

        const [day, week, month, year] = await Promise.all([
            this.calculateTotals(courierId, { ...baseOptions, timeFrame: 'day' }),
            this.calculateTotals(courierId, { ...baseOptions, timeFrame: 'week' }),
            this.calculateTotals(courierId, { ...baseOptions, timeFrame: 'month' }),
            this.calculateTotals(courierId, { ...baseOptions, timeFrame: 'year' })
        ]);

        return { day, week, month, year };
    }

    static async updateStatus(pickupId, status, courierId, reason = '') {
        // Validate status
        if (!Object.values(PickupStatus).includes(status)) {
            throw ErrorTypes.VALIDATION_ERROR('Invalid pickup status');
        }

        // Validate reason for cancellation
        if (status === PickupStatus.CANCELLED && !reason) {
            throw ErrorTypes.VALIDATION_ERROR('Reason is required when rejecting a pickup');
        }

        // Prepare the update data
        const updateData = {
            pickup_status: status,
            // Set reason to empty string by default instead of null
            reason: status === PickupStatus.CANCELLED ? reason : '',
        };

        // Add courier_id if provided
        if (courierId) {
            updateData.courier_id = parseInt(courierId, 10);
        }

        return await prisma.pickup_waste.update({
            where: {
                pickup_id: pickupId,
            },
            data: updateData
        });
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

        const [historyData, pickupDetails, totalCount] = await Promise.all([
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
            prisma.$queryRaw`
                SELECT 
                    pd.pickup_id, 
                    pd.quantity, 
                    w.waste_name
                FROM 
                    pickup_detail pd
                JOIN 
                    waste w ON pd.waste_id = w.waste_id
            `,
            prisma.pickup_waste.count({ where: filters })
        ]);

        // Group pickup details by pickup_id
        const pickupDetailsMap = pickupDetails.reduce((acc, detail) => {
            if (!acc[detail.pickup_id]) {
                acc[detail.pickup_id] = [];
            }
            acc[detail.pickup_id].push({
                quantity: detail.quantity,
                wasteName: detail.waste_name
            });
            return acc;
        }, {});

        // Merge pickup details with pickup waste data
        const transformedData = historyData.map(pickup => ({
            ...pickup,
            wasteDetails: pickupDetailsMap[pickup.pickup_id] || []
        }));

        return {
            data: transformedData,
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
        const { reason } = req.body;
        const updatedPickup = await PickupService.updateStatus(
            validateId(req.params.id),
            status,
            req.query.courierId,
            reason
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
        const {
            timePeriod,
            startDate,
            endDate
        } = req.query;

        // Validate input
        const options = {};

        if (timePeriod) {
            if (!['day', 'week', 'month', 'year'].includes(timePeriod)) {
                throw new BadRequestError('Invalid time period. Must be day, week, month, or year.');
            }
            options.timeFrame = timePeriod;
        }

        // Parse and validate dates if provided
        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                throw new BadRequestError('Invalid start date format');
            }
            options.startDate = parsedStartDate;
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                throw new BadRequestError('Invalid end date format');
            }
            options.endDate = parsedEndDate;
        }

        // Validate date range if both provided
        if (options.startDate && options.endDate && options.startDate >= options.endDate) {
            throw new BadRequestError('Start date must be before end date');
        }

        try {
            const totals = timePeriod
                ? await PickupService.calculateTotals(courierId, options)
                : await PickupService.getDetailedPickupTotals(courierId, options);

            // Logging with additional context
            logger.info('Pickup totals calculated', {
                context: {
                    courierId,
                    timePeriod: timePeriod || 'all periods',
                    dateRange: {
                        start: options.startDate,
                        end: options.endDate
                    },
                    totalCount: Object.values(totals).reduce((sum, period) =>
                        sum + (period.totalDelivered || 0) +
                        (period.totalOnDelivery || 0) +
                        (period.totalCompleted || 0) +
                        (period.totalCancelled || 0), 0)
                },
                totals
            });

            return { totals };
        } catch (error) {
            logger.error('Failed to calculate pickup totals', {
                error: {
                    message: error.message,
                    name: error.name,
                    courierId,
                    timePeriod,
                    startDate,
                    endDate
                },
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

        const [historyData, pickupDetails, totalCount] = await Promise.all([
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
            prisma.$queryRaw`
                SELECT 
                    pd.pickup_id, 
                    pd.quantity, 
                    w.waste_name
                FROM 
                    pickup_detail pd
                JOIN 
                    waste w ON pd.waste_id = w.waste_id
            `,
            prisma.pickup_waste.count({ where: filters })
        ]);

        // Group pickup details by pickup_id
        const pickupDetailsMap = pickupDetails.reduce((acc, detail) => {
            if (!acc[detail.pickup_id]) {
                acc[detail.pickup_id] = [];
            }
            acc[detail.pickup_id].push({
                quantity: detail.quantity,
                wasteName: detail.waste_name
            });
            return acc;
        }, {});

        // Merge pickup details with pickup waste data
        const transformedData = historyData.map(pickup => ({
            ...pickup,
            wasteDetails: pickupDetailsMap[pickup.pickup_id] || []
        }));

        return {
            data: transformedData,
            total: totalCount,
            page: parseInt(page, 10),
            totalPages: Math.ceil(totalCount / pagination.take)
        };
    });
