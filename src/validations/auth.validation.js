const joi = require('joi');
const constants = require('../config/constants');

const login = {
    // query: joi.object().keys({
    //     loginType: joi.string().valid(...Object.values(constants.LOGIN_TYPE)).required(),
    // }),
    params: joi.object().keys({}),
    body: joi.object().keys({
        id : joi.string().required(),
        password : joi.string().required(),
        keyRing: joi.any(),
    }),
}

const refreshToken = {
    query: joi.object().keys({
    }),
    params: joi.object().keys({}),
    body: joi.object().keys({
        refreshToken : joi.string().required(),
    }),
}


module.exports = {
    login,
    refreshToken
}
