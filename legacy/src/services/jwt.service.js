const jwt = require('jsonwebtoken');
const config = require('../config/config');
const constants = require('../config/constants');
const dayjs = require('dayjs');

const generateStudentJSONWebToken = async function (studentDTO, expires, tokenType, privateKey = config.jwt.privateKey) {
    let payload;

    if (tokenType === constants.TOKEN_TYPE.ACCESS) {
        payload = {
            sub: {
                studentId: studentDTO.student_id,
                role: constants.ROLE.STUDENT
            },
            iat: dayjs().unix(),
            exp: expires.unix(),
            type: tokenType,
        };
    }
    else if (tokenType === constants.TOKEN_TYPE.REFRESH) {
        payload = {
            sub: {
                studentId: studentDTO.student_id,
                role: constants.ROLE.STUDENT
            },
            iat: dayjs().unix(),
            exp: expires.unix(),
            type: tokenType,
        };
    }

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};
const generateAdminJSONWebToken = async function (adminDTO, expires, tokenType, privateKey = config.jwt.privateKey) {
    let payload;

    if (tokenType === constants.TOKEN_TYPE.ACCESS) {
        payload = {
            sub: {
                adminId: adminDTO.admin_id,
                role: adminDTO.role
            },
            iat: dayjs().unix(),
            exp: expires.unix(),
            type: tokenType,
        };
    }
    else if (tokenType === constants.TOKEN_TYPE.REFRESH) {
        payload = {
            sub: {
                adminId: adminDTO.admin_id,
                role: adminDTO.role
            },
            iat: dayjs().unix(),
            exp: expires.unix(),
            type: tokenType,
        };
    }

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};

const generateStudentAuthTokens = async function (studentDTO) {
    const accessTokenExpires = dayjs().add(config.jwt.accessTokenExpirationMinutes, 'minutes');
    const refreshTokenExpires = dayjs().add(config.jwt.refreshTokenExpirationHours, 'hours');

    const accessToken = await generateStudentJSONWebToken(studentDTO, accessTokenExpires, constants.TOKEN_TYPE.ACCESS);
    const refreshToken = await generateStudentJSONWebToken(studentDTO, refreshTokenExpires, constants.TOKEN_TYPE.REFRESH);
    return [
        {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
            token_type: constants.TOKEN_TYPE.ACCESS,
        },
        {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
            token_type: constants.TOKEN_TYPE.REFRESH,
        },
    ];
};
const generateAdminAuthTokens = async function (adminDTO) {
    const accessTokenExpires = dayjs().add(config.jwt.accessTokenExpirationMinutes, 'minutes');
    const refreshTokenExpires = dayjs().add(config.jwt.refreshTokenExpirationHours, 'hours');

    const accessToken = await generateAdminJSONWebToken(adminDTO, accessTokenExpires, constants.TOKEN_TYPE.ACCESS);
    const refreshToken = await generateAdminJSONWebToken(adminDTO, refreshTokenExpires, constants.TOKEN_TYPE.REFRESH);
    return [
        {
            token: accessToken,
            expires: accessTokenExpires.toDate(),
            token_type: constants.TOKEN_TYPE.ACCESS,
        },
        {
            token: refreshToken,
            expires: refreshTokenExpires.toDate(),
            token_type: constants.TOKEN_TYPE.REFRESH,
        },
    ];
};


const getJwtPayload = function (token) {
    try {
        return jwt.verify(token, config.jwt.publicKey, { algorithm: 'RS256' });
    } catch (err) {
        return false;
    }
};

module.exports = {
    getJwtPayload,
    generateStudentAuthTokens,
    generateAdminAuthTokens,
};
