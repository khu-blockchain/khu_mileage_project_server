const catchAsync = require('../utils/catchAsync');
const { swMileageTokenHistoryService } = require("../services");
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const {
    GetSwMileageTokenHistoryListDTO,
} = require('../dtos/swMileageTokenHistory.dto');
const {
    VerifiedPayloadDTO,
} = require('../dtos/auth.dto');
const config = require('../config/config');

const getSwMileageTokenHistoryList = catchAsync(async (req, res) => {
    const {isCount} = {...req.query};

    const getSwMileageTokenHistoryListDTO = new GetSwMileageTokenHistoryListDTO({ ...req.query, ...req.params, ...req.body })
    const swMileageList = await swMileageTokenHistoryService.getSwMileageTokenHistoryList(getSwMileageTokenHistoryListDTO);

    if (isCount) {
        getSwMileageTokenHistoryListDTO.limit = null;
        getSwMileageTokenHistoryListDTO.offset = null;
        getSwMileageTokenHistoryListDTO.last_id = null;

        const total = await swMileageTokenHistoryService.getSwMileageTokenHistoryList(getSwMileageTokenHistoryListDTO);
        const totalCount = total.length ? total.length : 0;
        return res.send({
            list: swMileageList,
            totalCount: totalCount,
        });
    }

    return res.status(httpStatus.OK).json(swMileageList);
})

const getSwMileageTokenHistoryById = catchAsync(async (req, res) => {
    const { swMileageTokenHistoryId } = { ...req.query, ...req.params, ...req.body }

    const swMileageTokenHistory = await swMileageTokenHistoryService.getSwMileageTokenHistoryById(swMileageTokenHistoryId);
    if (!swMileageTokenHistory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageTokenHistory not found')
    }

    return res.status(httpStatus.OK).json(swMileageTokenHistory);
})

const getSwMileageTokenHistoryByTransactionHash = catchAsync(async (req, res) => {
    const { transactionHash } = { ...req.query, ...req.params, ...req.body }
    const data = { ...req.query, ...req.params, ...req.body }

    const swMileageTokenHistory = await swMileageTokenHistoryService.getSwMileageTokenHistoryByTransactionHash(transactionHash);
    if (!swMileageTokenHistory) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageTokenHistory not found')
    }

    return res.status(httpStatus.OK).json(swMileageTokenHistory);
})

module.exports = {
    getSwMileageTokenHistoryList,
    getSwMileageTokenHistoryById,
    getSwMileageTokenHistoryByTransactionHash,
}