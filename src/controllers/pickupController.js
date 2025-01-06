import { prisma } from '../database.js';
import { logger } from '../utils/logger.js';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

const PickupStatus = {
    REQUESTED: 'Menunggu_Penjemputan',
    ACCEPTED: 'Dalam_Perjalanan',
    COMPLETED: 'Sampah_telah_dijemput',
    CANCELLED: 'Penjemputan_Gagal',
    FINISHED: 'Pesanan_Selesai'
};

const SortableFields = {
    PICKUP_DATE: 'pickup_date',
    PICKUP_STATUS: 'pickup_status',
    PICKUP_ADDRESS: 'pickup_address'
};

const ValidationRules = {
    ALLOWED_SORT_FIELDS: Object.values(SortableFields),
    ALLOWED_SORT_ORDERS: ['asc', 'desc']
};

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

const validateId = (id, type = 'pickup') => {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) throw ErrorTypes.INVALID_ID(type);
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

class PickupService {
    static #STATUSES = [
        { status: PickupStatus.REQUESTED, field: 'totalRequested' },
        { status: PickupStatus.ACCEPTED, field: 'totalOnDelivery' },
        { status: PickupStatus.CANCELLED, field: 'totalCancelled' },
        { status: PickupStatus.COMPLETED, field: 'totalDelivered' },
        { status: PickupStatus.FINISHED, field: 'totalFinished' }
    ];

    static async calculateTotals(courierId, options = {}) {
        const { timeFrame = 'day', startDate: customStartDate, endDate: customEndDate } = options;

        let startDate = customStartDate;
        let endDate = customEndDate;

        if (!startDate || !endDate) {
            const now = new Date();
            switch (timeFrame) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    break;
                case 'week':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    endDate = new Date(now.getFullYear() + 1, 0, 1);
                    break;
                default:
                    throw new Error('Invalid time frame');
            }
        }

        const totals = await Promise.all(
            this.#STATUSES.map(async ({ status, field }) => ({
                [field]: await prisma.pickup_waste.count({
                    where: {
                        courier_id: courierId,
                        pickup_status: status,
                        created_at: { gte: startDate, lt: endDate }
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
        const [day, week, month, year] = await Promise.all([
            this.calculateTotals(courierId, { ...options, timeFrame: 'day' }),
            this.calculateTotals(courierId, { ...options, timeFrame: 'week' }),
            this.calculateTotals(courierId, { ...options, timeFrame: 'month' }),
            this.calculateTotals(courierId, { ...options, timeFrame: 'year' })
        ]);

        return { day, week, month, year };
    }

    static async updateStatus(pickupId, status, courierId, reason = '') {
        if (!Object.values(PickupStatus).includes(status)) {
            throw ErrorTypes.VALIDATION_ERROR('Invalid pickup status');
        }

        if (status === PickupStatus.CANCELLED && !reason) {
            throw ErrorTypes.VALIDATION_ERROR('Reason is required when rejecting a pickup');
        }

        const updateData = {
            pickup_status: status,
            reason: status === PickupStatus.CANCELLED ? reason : '',
        };

        if (courierId) {
            updateData.courier_id = parseInt(courierId, 10);
        }

        return await prisma.pickup_waste.update({
            where: { pickup_id: pickupId },
            data: updateData
        });
    }

    static async getPickupById(pickupId) {
        const pickup = await prisma.pickup_waste.findUnique({
            where: { pickup_id: pickupId },
            select: {
                pickup_id: true,
                pickup_date: true,
                pickup_address: true,
                pickup_status: true,
                dropbox: { select: { name: true, address: true } },
                community: { select: { name: true, phone: true } },
                courier: { select: { name: true, email: true, phone: true } }
            }
        });

        if (!pickup) {
            throw ErrorTypes.NOT_FOUND('pickup');
        }

        // Fetch pickup details (waste items)
        const pickupDetails = await prisma.$queryRaw`
            SELECT pd.pickup_id, pd.quantity, w.waste_name
            FROM pickup_detail pd
            JOIN waste w ON pd.waste_id = w.waste_id
            WHERE pd.pickup_id = ${pickupId}
        `;

        return {
            ...pickup,
            wasteDetails: pickupDetails.map(detail => ({
                quantity: detail.quantity,
                wasteName: detail.waste_name
            }))
        };
    }
}

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

        const { sortBy: validatedSortBy, order: validatedOrder } = validateSortParams(sortBy, order);

        const pagination = {
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10)
        };

        const filters = {
            ...(status && { pickup_status: status }),
            ...(search && { pickup_address: { contains: search } }),
            ...(startDate && endDate && {
                pickup_date: { gte: new Date(startDate), lte: new Date(endDate) }
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
                    dropbox: { select: { name: true, address: true } },
                    community: { select: { name: true, phone: true } },
                    courier: { select: { name: true, email: true, phone: true } }
                }
            }),
            prisma.$queryRaw`
                SELECT pd.pickup_id, pd.quantity, w.waste_name
                FROM pickup_detail pd
                         JOIN waste w ON pd.waste_id = w.waste_id
            `,
            prisma.pickup_waste.count({ where: filters })
        ]);

        const pickupDetailsMap = pickupDetails.reduce((acc, detail) => {
            if (!acc[detail.pickup_id]) acc[detail.pickup_id] = [];
            acc[detail.pickup_id].push({ quantity: detail.quantity, wasteName: detail.waste_name });
            return acc;
        }, {});

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
        const { timePeriod, startDate, endDate } = req.query;

        const options = {};

        if (timePeriod) {
            if (!['day', 'week', 'month', 'year'].includes(timePeriod)) {
                throw new Error('Invalid time period. Must be day, week, month, or year.');
            }
            options.timeFrame = timePeriod;
        }

        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) throw new Error('Invalid start date format');
            options.startDate = parsedStartDate;
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) throw new Error('Invalid end date format');
            options.endDate = parsedEndDate;
        }

        if (options.startDate && options.endDate && options.startDate >= options.endDate) {
            throw new Error('Start date must be before end date');
        }

        const totals = timePeriod
            ? await PickupService.calculateTotals(courierId, options)
            : await PickupService.getDetailedPickupTotals(courierId, options);

        logger.info('Pickup totals calculated', {
            context: { courierId, timePeriod: timePeriod || 'all periods', dateRange: { start: options.startDate, end: options.endDate } },
            totals
        });

        return { totals };
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

        const { sortBy: validatedSortBy, order: validatedOrder } = validateSortParams(sortBy, order);

        const pagination = {
            skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            take: parseInt(limit, 10)
        };

        const filters = {
            ...(courierId && { courier_id: parseInt(courierId, 10) }),
            ...(status && { pickup_status: status }),
            ...(search && { pickup_address: { contains: search } }),
            ...(startDate && endDate && {
                pickup_date: { gte: new Date(startDate), lte: new Date(endDate) }
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
                    dropbox: { select: { name: true, address: true } },
                    community: { select: { name: true, phone: true } },
                    courier: { select: { name: true, email: true, phone: true } }
                }
            }),
            prisma.$queryRaw`
                SELECT pd.pickup_id, pd.quantity, w.waste_name
                FROM pickup_detail pd
                         JOIN waste w ON pd.waste_id = w.waste_id
            `,
            prisma.pickup_waste.count({ where: filters })
        ]);

        const pickupDetailsMap = pickupDetails.reduce((acc, detail) => {
            if (!acc[detail.pickup_id]) acc[detail.pickup_id] = [];
            acc[detail.pickup_id].push({ quantity: detail.quantity, wasteName: detail.waste_name });
            return acc;
        }, {});

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