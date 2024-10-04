const catchAsync = require('../utils/catchAsync');
const { authService, studentService, jwtService, cookieService, adminService } = require("../services");
const httpStatus = require('http-status');
const constants = require('../config/constants');
const ApiError = require('../utils/ApiError');

const login = catchAsync(async (req, res) => {
    const { loginType, id, password } = { ...req.query, ...req.params, ...req.body };

    if (loginType === constants.LOGIN_TYPE.STUDENT) {
        const studentDTO = await studentService.getStudentById(id);
        if (!studentDTO) {
            throw new ApiError(httpStatus.NOT_FOUND, "student not found")
        }

        const { password: hashPassword, salt } = await studentService.getStudentPasswordAndSaltById(id);
        const md5password = authService.hashPassword(password);
        const saltPassword = await authService.getSaltPassword(salt, md5password);
        if (saltPassword !== hashPassword) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'wrong password');
        }

        const tokens = await jwtService.generateStudentAuthTokens(studentDTO);

        const refreshToken = tokens.filter(token => token.token_type === constants.TOKEN_TYPE.REFRESH);
        cookieService.setCookie(res, constants.COOKIE.NAME, refreshToken[0].token, refreshToken[0].expires);

        return res.status(httpStatus.OK).json({
            student: studentDTO,
            tokens,
        });
    }
    if (loginType === constants.LOGIN_TYPE.ADMIN) {
        const adminDTO = await adminService.getAdminById(id);
        if (!adminDTO) {
            throw new ApiError(httpStatus.NOT_FOUND, "admin not found")
        }

        const { password: hashPassword, salt } = await adminService.getAdminPasswordAndSaltById(id);
        const md5password = authService.hashPassword(password);
        const saltPassword = await authService.getSaltPassword(salt, md5password);
        if (saltPassword !== hashPassword) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'wrong password');
        }

        const tokens = await jwtService.generateAdminAuthTokens(adminDTO);

        const refreshToken = tokens.filter(token => token.token_type === constants.TOKEN_TYPE.REFRESH);
        cookieService.setCookie(res, constants.COOKIE.NAME, refreshToken[0].token, refreshToken[0].expires);

        return res.status(httpStatus.OK).json({
            admin: adminDTO,
            tokens,
        });
    }

    return res.sendStatus(httpStatus.CONFLICT, 'not supported login type')
})

const refreshToken = catchAsync(async(req, res) => {
    const {refreshToken} = {...req.body}
    const jwtPayload = await jwtService.getJwtPayload(refreshToken);

    if (!jwtPayload) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token")
    }
    if (jwtPayload.type !== constants.TOKEN_TYPE.REFRESH) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token Type")
    }

    if (jwtPayload?.sub?.studentId) {
        const studentDTO = await studentService.getStudentById(jwtPayload?.sub?.studentId);
        if (!studentDTO) {
            throw new ApiError(httpStatus.NOT_FOUND, "student not found")
        }
        const tokens = await jwtService.generateStudentAuthTokens(studentDTO);

        const refreshToken = tokens.filter(token => token.token_type === constants.TOKEN_TYPE.REFRESH);
        cookieService.setCookie(res, constants.COOKIE.NAME, refreshToken[0].token, refreshToken[0].expires);

        return res.status(httpStatus.OK).json({
            student: studentDTO,
            tokens,
        });
    }
    else if (jwtPayload?.sub?.adminId) {
        const adminDTO = await adminService.getAdminByPK(jwtPayload?.sub?.adminId);
        if (!adminDTO) {
            throw new ApiError(httpStatus.NOT_FOUND, "admin not found")
        }

        const tokens = await jwtService.generateAdminAuthTokens(adminDTO);
        const refreshToken = tokens.filter(token => token.token_type === constants.TOKEN_TYPE.REFRESH);
        cookieService.setCookie(res, constants.COOKIE.NAME, refreshToken[0].token, refreshToken[0].expires);

        return res.status(httpStatus.OK).json({
            admin: adminDTO,
            tokens,
        });
    }
    else {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token")
    }
})

module.exports = {
    login,
    refreshToken,
}