const httpStatus = require('http-status');
const passport = require('passport');
const ApiError = require('../utils/ApiError');
const constants = require('../config/constants');

const verifyAuthenticationCallback = (req, next) => (apiRole) => async (error, data, info) => {
    if (error || info || !data) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, info?.message ?? error?.message ?? 'Please authenticate'));
    }

    if (!checkRole(data.role, apiRole)) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Unauthorized client'));
    }

    // role에 따른 req 정보 전달
    if (data.role === constants.ROLE.STUDENT) {
        req.verifiedPayload = {
            studentId: data.studentId,
            role: data.role
        };
    }
    if (data.role >= constants.ROLE.ADMIN) {
        req.verifiedPayload = {
            adminId : data.adminId,
            role: data.role
        };
    }

    next();
};

const auth = (role) => async (req, res, next) => {
    passport.authenticate('jwt', { session: false }, await verifyAuthenticationCallback(req, next)(role))(req, res, next);
};

const checkRole = (role, apiRole) => {
    return (role >= apiRole);
};

module.exports = auth;
