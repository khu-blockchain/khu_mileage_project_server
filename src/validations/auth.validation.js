const joi = require('joi');
const constants = require('../config/constants');

const login = {
    query: joi.object().keys({
    }),
    params: joi.object().keys({}),
    body: joi.object().keys({
        loginType: joi.string().valid(...Object.values(constants.LOGIN_TYPE)).required(),
        id : joi.string().required(),
        password : joi.string().required(),
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
