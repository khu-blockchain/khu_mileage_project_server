const catchAsync = require('../utils/catchAsync');
const { swMileageService, authService, studentService } = require("../services");
const uploader = require('../config/fileUploader');
const constants = require('../config/constants');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const {
    GetSwMileageListDTO,
    CreateSwMileageDTO,
    UpdateSwMileageDTO,
    UpdateSwMileageStatusDTO,
    GetSwMileageFileListDTO,
} = require('../dtos/swMileage.dto');
const {
    VerifiedPayloadDTO,
} = require('../dtos/auth.dto');
const getSwMileageList = catchAsync(async (req, res) => {
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    if (verifiedPayloadDTO.role === constants.ROLE.STUDENT) {
        const { studentId } = { ...req.query, ...req.params, ...req.body }
        if (studentId === null || studentId === undefined) {
            throw new ApiError(httpStatus.BAD_REQUEST, "studentId is required")
        }
        if (verifiedPayloadDTO.studentId !== studentId) {
            throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
        }
    }

    const getSwMileageListDTO = new GetSwMileageListDTO({ ...req.query, ...req.params, ...req.body })
    const swMileageList = await swMileageService.getSwMileageList(getSwMileageListDTO);

    return res.status(httpStatus.OK).json(swMileageList);
})

const createSwMileage = catchAsync(async (req, res) => {
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    if (verifiedPayloadDTO.role >= constants.ROLE.ADMIN) {
        throw new ApiError(httpStatus.UNAUTHORIZED, `admin can't create swMileage`)
    }

    const student = await studentService.getStudentById(verifiedPayloadDTO.studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    const createSwMileageDTO = new CreateSwMileageDTO({ ...req.query, ...req.params, ...req.body, ...req.requestData })
    const { result: validateStudentInfoResult, message } = await swMileageService.validateStudentInformation(student, createSwMileageDTO)
    if (!validateStudentInfoResult) {
        throw new ApiError(httpStatus.BAD_REQUEST, message)
    }

    // 1. files 업로드
    const files = req.files
    const uploadedFiles = await uploader.uploadFile(files);
    const fileList = uploadedFiles.map(el => {
        return {
            name: el.info.filename,
            url: el.url
        }
    })

    const { swMileage, swMileageFiles } = await swMileageService.createSwMileageAndFiles(createSwMileageDTO, fileList);

    return res.status(httpStatus.CREATED).json({ swMileage, swMileageFiles });
})

const getSwMileageById = catchAsync(async (req, res) => {
    const { swMileageId } = { ...req.query, ...req.params, ...req.body }

    const swMileage = await swMileageService.getSwMileageById(swMileageId);
    if (!swMileage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    if (verifiedPayloadDTO.role === constants.ROLE.STUDENT && swMileage.student_id !== verifiedPayloadDTO.studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    return res.status(httpStatus.OK).json(swMileage);
})

// todo: 개발 필요
const updateSwMileage = catchAsync(async (req, res) => {
    const { swMileageId } = { ...req.query, ...req.params, ...req.body }

    const swMileage = await swMileageService.getSwMileageById(swMileageId);
    if (!swMileage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    if (verifiedPayloadDTO.role === constants.ROLE.STUDENT && swMileage.student_id !== verifiedPayloadDTO.studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const updateSwMileageDTO = new UpdateSwMileageDTO({ ...req.query, ...req.params, ...req.body })
    const updatedSwMileage = await swMileageService.updateSwMileage(swMileageId, updateSwMileageDTO);π

    return res.status(httpStatus.OK).json(updatedSwMileage);
})

const updateSwMileageStatus = catchAsync(async (req, res) => {
    const { swMileageId } = { ...req.query, ...req.params, ...req.body }

    const swMileage = await swMileageService.getSwMileageById(swMileageId);
    if (!swMileage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const updateSwMileageDTO = new UpdateSwMileageStatusDTO({ ...req.query, ...req.params, ...req.body })
    const updatedSwMileage = await swMileageService.updateSwMileage(swMileageId, updateSwMileageDTO);

    return res.status(httpStatus.OK).json(updatedSwMileage);
})

// todo: 개발 필요
const deleteSwMileage = catchAsync(async (req, res) => {
    const { swMileageId } = { ...req.query, ...req.params, ...req.body }

    const swMileage = await swMileageService.getSwMileageById(swMileageId);
    if (!swMileage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    if (verifiedPayloadDTO.role === constants.ROLE.STUDENT && swMileage.student_id !== verifiedPayloadDTO.studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    await swMileageService.deleteSwMileage(swMileageId);

    return res.sendStatus(httpStatus.NO_CONTENT);
})

const getSwMileageFileList = catchAsync(async (req, res) => {
    // todo: 학생 것만 보도록 validation

    const getSwMileageFileListDTO = new GetSwMileageFileListDTO({ ...req.query, ...req.params, ...req.body })
    const swMileageList = await swMileageService.getSwMileageFileList(getSwMileageFileListDTO);

    
    return res.status(httpStatus.OK).json(swMileageList);
})

const getSwMileageFileById = catchAsync(async (req, res) => {
    const { swMileageFileId } = { ...req.query, ...req.params, ...req.body }

    const swMileageFile = await swMileageService.getSwMileageFileById(swMileageFileId);
    if (!swMileageFile) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageFile not found')
    }

    // todo: 학생 것만 보도록 validation

    return res.status(httpStatus.OK).json(swMileageFile);
})


module.exports = {
    getSwMileageList,
    createSwMileage,
    getSwMileageById,
    updateSwMileage,
    updateSwMileageStatus,
    deleteSwMileage,
    getSwMileageFileList,
    getSwMileageFileById,
}