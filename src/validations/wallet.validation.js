const joi = require('joi');
const { walletAddressValidation } = require('./custom.validation')

const createWalletLost = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({
        studentId: joi.string().required(),
        targetAddress: joi.string().custom(walletAddressValidation),
        //rawTransaction: joi.string().required(), //별도로 신청 트랜잭션은 없는게 맞는지 다시 확인
    })
}

const getWalletLostList = {
    query: joi.object().keys({
        limit: joi.number().default(3),
        lastId: joi.number(), 
    }),
    params: joi.object().keys({}),
    body: joi.object().keys({}),
}

const getWalletLostByStudentId = {
    query: joi.object().keys({
        limit: joi.number().default(3),
        lastId: joi.number(), 
    }),
    params: joi.object().keys({
        studentId: joi.string().required(),
    }),
    body: joi.object().keys({}),
}

const approveWalletLost = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({
        walletHistoryId: joi.string().required(),
        studentId: joi.string().required(),
        rawTransaction: joi.string().required(),
    }),
}

module.exports = {
    createWalletLost,
    getWalletLostList,
    getWalletLostByStudentId,
    approveWalletLost
};