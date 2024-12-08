const joi = require('joi');
const { rawTransactionValidation } = require('./custom.validation');
const constants = require('../config/constants');

const getSwMileageTokenList = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({}),
}

const createSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({
        swMileageTokenName: joi.string().required(),
        description: joi.string().required(),
        symbol: joi.string().required(), // todo 1-11 자리
        decimals: joi.number().default(18),
        imageUrl: joi.string().required(),
        initialSupply: joi.number().default(100000000000000000000),
        rlpEncodingString : joi.string(),
    }),
}

const getSwMileageTokenById = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({}),
}

const updateSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({})
}

const deleteSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({}),
}

const activateSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({}),
}

const mintSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({
        studentId: joi.string().required(),
        amount: joi.number().required(),
        comment : joi.string(),
    }),
}

const burnFromSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({
        studentId: joi.number().required(),
        amount: joi.number().required(),
        comment : joi.string(),
    }),
}

const approveSwMileageToken = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({
        rawTransaction: joi.custom(rawTransactionValidation).required(),
        studentId: joi.string().required(),
    }),
}

const getApproveSwMileageTokenData = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({}),
}

const getSwMileageTokenHistoryList = {
    query: joi.object().keys({
        status: joi.number().valid(...Object.values(constants.SW_MILEAGE_TOKEN_HISTORY.STATUS)),
        transactionType: joi.string().valid(...Object.values(constants.SW_MILEAGE_TOKEN_HISTORY.TRANSACTION_TYPE)),
        adminId: joi.number(),
        adminAddress: joi.string(),
        studentAddress: joi.string(),
        studentId: joi.string(),
    }),
    params: joi.object().keys({
        swMileageTokenId: joi.string().required(),
    }),
    body: joi.object().keys({}),
}
const getSwMileageTokenHistoryById = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenHistoryId: joi.number().required(),
        swMileageTokenId: joi.string().required(),
    }),
    body: joi.object().keys({}),
}

const getStudentsRankingRange = {
    query: joi.object().keys({
        from: joi.number().required(),
        to: joi.number().required()
    }),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({}),    
}

const addSwmileageTokenAdmin = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        swMileageTokenId: joi.number().required(),
    }),
    body: joi.object().keys({
        rawTransaction: joi.string().required(),
    }),    
}

const getSwMileageTokenABIandByteCode = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({}),   
}

module.exports = {
    getSwMileageTokenList,
    createSwMileageToken,
    getSwMileageTokenById,
    updateSwMileageToken,
    deleteSwMileageToken,
    activateSwMileageToken,
    mintSwMileageToken,
    burnFromSwMileageToken,
    approveSwMileageToken,
    getApproveSwMileageTokenData,
    getSwMileageTokenHistoryList,
    getSwMileageTokenHistoryById,
    getStudentsRankingRange,
    addSwmileageTokenAdmin,
    getSwMileageTokenABIandByteCode,
}
