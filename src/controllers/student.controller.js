const catchAsync = require('../utils/catchAsync');
const { studentService, authService } = require("../services");
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const {
    GetStudentListDTO,
    CreateStudentDTO,
    UpdateStudentDTO,
} = require('../dtos/student.dto');
const constants = require('../config/constants');

const getStudentList = catchAsync(async (req, res) => {
    const getStudentListDTO = new GetStudentListDTO({ ...req.query, ...req.params, ...req.body })
    const studentList = await studentService.getStudentList(getStudentListDTO);

    return res.status(httpStatus.OK).json(studentList);
})

const createStudent = catchAsync(async (req, res) => {
    // validation : password and passwordConfirm is equal
    const { password, passwordConfirm } = { ...req.query, ...req.params, ...req.body }
    if (password !== passwordConfirm) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'password and passwordConfirm must be equal')
    }

    // validation : check walletAddress already used
    const { walletAddress } = { ...req.query, ...req.params, ...req.body }
    if (await studentService.getStudentByWalletAddress(walletAddress)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'walletAddress already used')
    }

    // validation : check studentId already used
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    if (await studentService.getStudentById(studentId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'studentId already used')
    }

    // md5, salt를 사용한 password 암호화, db에 저장되는 값은 암호화된 password 입니다.
    const md5password = authService.hashPassword(password);
    const salt = authService.generateSalt();
    const hashPassword = authService.getSaltPassword(salt, md5password);

    // create student
    const createStudentDTO = new CreateStudentDTO({ ...req.query, ...req.params, ...req.body, salt, password: hashPassword })
    const student = await studentService.createStudent(createStudentDTO);

    return res.status(httpStatus.CREATED).json(student);
})

const getStudentById = catchAsync(async (req, res) => {
    const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload }
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    return res.status(httpStatus.OK).json(student);
})

const updateStudent = catchAsync(async (req, res) => {
    const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload }
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    const updateStudentDTO = new UpdateStudentDTO({ ...req.query, ...req.params, ...req.body })
    const updatedStudent = await studentService.updateStudent(studentId, updateStudentDTO);

    return res.status(httpStatus.OK).json(updatedStudent);
})

const deleteStudent = catchAsync(async (req, res) => {
    const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload }
    const { studentId } = { ...req.query, ...req.params, ...req.body }
    if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    await studentService.deleteStudent(studentId);

    return res.sendStatus(httpStatus.NO_CONTENT);
})

module.exports = {
    getStudentList,
    createStudent,
    getStudentById,
    updateStudent,
    deleteStudent,
}
