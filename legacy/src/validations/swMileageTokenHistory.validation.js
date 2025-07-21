const joi = require('joi');
const constants = require('../config/constants');

const getSwMileageTokenHistoryList = {
    query: joi.object().keys({
        swMileageTokenId: joi.number(),
        type: joi.array().items(joi.string().valid(...Object.values(constants.SW_MILEAGE_TOKEN_HISTORY.TYPE))),
        // type: joi.string().valid()),
        adminAddress: joi.string(),
        studentAddress: joi.string(),
        studentId: joi.string(),
        lastId: joi.number(),
        order: joi.string().valid('ASC', "DESC"),
        limit: joi.number(),
        offset: joi.number(),
        isCount: joi.number().valid(0,1),
    }).and("order", "lastId"),
    params: joi.object().keys({
    }),
    body: joi.object().keys({}),
}

const getSwMileageTokenHistoryById = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenHistoryId: joi.number().required(),
    }),
    body: joi.object().keys({}),
}

const getSwMileageTokenHistoryByTransactionHash = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        transactionHash: joi.string().required(),
    }),
    body: joi.object().keys({}),
}

module.exports = {
    getSwMileageTokenHistoryList,
    getSwMileageTokenHistoryById,
    getSwMileageTokenHistoryByTransactionHash,
}
