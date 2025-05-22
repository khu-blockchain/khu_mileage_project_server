const catchAsync = require('../utils/catchAsync');
const { authService, adminService, caverService, swMileageService, swMileageTokenService } = require("../services");
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const config = require('../config/config');
const {
    GetStudentListDTO,
    CreateStudentDTO,
    UpdateStudentDTO,
} = require('../dtos/student.dto');
const constants = require('../config/constants');
const { GetAdminListDTO, UpdateAdminDTO, CreateAdminDTO } = require('../dtos/admin.dto');

const getAdminList = catchAsync(async (req, res) => {
    const getAdminListDTO = new GetAdminListDTO({ ...req.query, ...req.params, ...req.body })
    const adminList = await adminService.getAdminList(getAdminListDTO);

    return res.status(httpStatus.OK).json(adminList);
})

const createAdmin = catchAsync(async (req, res) => {

    // validation : password and passwordConfirm is equal
    const { password, passwordConfirm } = { ...req.query, ...req.params, ...req.body }
    if (password !== passwordConfirm) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'password and passwordConfirm must be equal')
    }

    // TODO : 배포 전 주석 삭제
    // validation : check walletAddress already used
    // const { walletAddress } = { ...req.query, ...req.params, ...req.body }
    // if (await adminService.getAdminByWalletAddress(walletAddress)) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'walletAddress already used')
    // }

    // validation : check adminId already used

    const { adminId } = { ...req.query, ...req.params, ...req.body } // TODO : check adn delete
    if (await adminService.getAdminById(adminId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'adminId already used')
    }


    const md5password = authService.hashPassword(password);
    const salt = authService.generateSalt();
    const hashPassword = authService.getSaltPassword(salt, md5password);

    const createAdminDTO = new CreateAdminDTO({ ...req.query, ...req.params, ...req.body, role: constants.ROLE.ADMIN, salt, password: hashPassword })

    const admin = await adminService.createAdmin(createAdminDTO);
    
    // 토큰이 있으면 어드민 추가, 없으면 넘어감

    // const swMileageToken = await swMileageTokenService.getActivateSwmileagetoken();

    // caverService.addAdminByFeePayer(admin.wallet_address, swMileageToken.contract_address)

    return res.status(httpStatus.CREATED).json(admin);
})

const getAdminById = catchAsync(async (req, res) => {
    const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload }
    const { adminId } = { ...req.query, ...req.params, ...req.body }

    if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
    }

    return res.status(httpStatus.OK).json(admin);
})

const updateAdmin = catchAsync(async (req, res) => {
    const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload }
    const { adminId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }
    // wallet 주소 변경 시 admin 수정
    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
    }

    const updateAdminDTO = new UpdateAdminDTO({ ...req.query, ...req.params, ...req.body }) // TODO : body require 처리
    const updatedAdmin = await adminService.updateAdmin(adminId, updateAdminDTO);

    if (admin.wallet_address != updateAdminDTO.walletAddress) {
        await caverService.removeAdminByFeePayer(admin.wallet_address);
        await caverService.addAdminByFeePayer(updateAdminDTO.walletAddress)
    }
    
    return res.status(httpStatus.OK).json(updatedAdmin);
})

const deleteAdmin = catchAsync(async (req, res) => {
    const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload }
    const { adminId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const admin = await adminService.getAdminById(adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
    }

    await adminService.deleteAdmin(adminId);
    await caverService.removeAdminByFeePayer(admin.wallet_address);

    return res.sendStatus(httpStatus.NO_CONTENT);
})

module.exports = {
    getAdminList,
    createAdmin,
    getAdminById,
    updateAdmin,
    deleteAdmin,
}