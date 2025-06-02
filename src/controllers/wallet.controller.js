const catchAsync = require('../utils/catchAsync');
const { studentService, walletService } = require("../services");
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const {
    GetWalletLostListDTO,
    CreateWalletLostDTO,
    GetWalletLostByStudentIdDTO
} = require('../dtos/wallet.dto');
const constants = require('../config/constants');
const config = require('../config/config');

const getWalletLostList = catchAsync(async (req, res) => {
    const getWalletLostListDTO = new GetWalletLostListDTO({ ...req.query, ...req.params, ...req.body })
    console.log(`getWalletLostListDTO: ${JSON.stringify(getWalletLostListDTO)}`)
    const walletLostList = await walletService.getWalletLostList(getWalletLostListDTO);

    return res.status(httpStatus.OK).json(walletLostList);
})

const createWalletLost = catchAsync(async (req, res) => {
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    const student = await studentService.getStudentById(studentId)
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }
    const createWalletLostDTO = new CreateWalletLostDTO({ ...req.query, ...req.params, ...req.body, walletAddress: student.wallet_address })
    const walletLost = await walletService.createWalletLost(createWalletLostDTO);
    
    return res.status(httpStatus.CREATED).json({
        ...walletLost,
    });
})

const getWalletLostByStudentId = catchAsync(async (req, res) => {
    console.log("11111111111111111");
    const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload }
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    const getWalletLostByStudentIdDTO = new GetWalletLostByStudentIdDTO({ ...req.query, ...req.params, ...req.body, studentId: student.student_id })
    console.log(`getWalletLostByStudentIdDTO: ${JSON.stringify(getWalletLostByStudentIdDTO)}`)
    const walletLost = await walletService.getWalletLostByStudentId(getWalletLostByStudentIdDTO);

    return res.status(httpStatus.OK).json(walletLost);
})

module.exports = {
    getWalletLostList,
    createWalletLost,
    getWalletLostByStudentId,
};