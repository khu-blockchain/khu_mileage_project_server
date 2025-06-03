const catchAsync = require("../utils/catchAsync");
const {
  swMileageService,
  adminService,
  studentService,
} = require("../services");
const uploader = require("../config/fileUploader");
const constants = require("../config/constants");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const caverService = require("../services/caver.service");
const {
  GetSwMileageListDTO,
  CreateSwMileageDTO,
  UpdateSwMileageDTO,
  UpdateSwMileageStatusDTO,
  GetSwMileageFileListDTO,
} = require("../dtos/swMileage.dto");
const { VerifiedPayloadDTO } = require("../dtos/auth.dto");
const getSwMileageList = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (verifiedPayloadDTO.role === constants.ROLE.STUDENT) {
    const { studentId } = { ...req.query, ...req.params, ...req.body };
    if (studentId === null || studentId === undefined) {
      throw new ApiError(httpStatus.BAD_REQUEST, "studentId is required");
    }
    if (verifiedPayloadDTO.studentId !== studentId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
    }
  }

  const getSwMileageListDTO = new GetSwMileageListDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const swMileageList = await swMileageService.getSwMileageList(
    getSwMileageListDTO
  );

  return res.status(httpStatus.OK).json(swMileageList);
});

const createSwMileage = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (verifiedPayloadDTO.role >= constants.ROLE.ADMIN) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `admin can't create swMileage`);
  }

  const student = await studentService.getStudentById(
    verifiedPayloadDTO.studentId
  );
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }
  const createSwMileageDTO = new CreateSwMileageDTO({
    ...req.query,
    ...req.params,
    ...req.body,
    ...req.requestData,
    isConfirmed: 0,
  });
  const { result: validateStudentInfoResult, message } =
    await swMileageService.validateStudentInformation(
      student,
      createSwMileageDTO
    );
  if (!validateStudentInfoResult) {
    throw new ApiError(httpStatus.BAD_REQUEST, message);
  }

  // // rawTransaction을 깐뒤에 파일해시가 일치하는지 확인 (필요한지 고민, 파일 여러개면 해시 여러개??)
  // const decodedTransaction = await caverService.decodeRawTransaction(createSwMileageDTO.transaction_hash)
  // const hash = caverService.decodeTxInputAuto(decodedTransaction.input)
  // console.log("파일 해시값",hash.params) //해시값

  //tx전송 및 파일 업로드
  const { rawTransaction } = {
    ...req.query,
    ...req.params,
    ...req.body,
    ...req.requestData,
  };
  try {
    await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);

    // 1. files 업로드 TODO : local storage (이름 주소 그대로 노출되도 괜찮은지))
    const files = req.files;
    const uploadedFiles = await uploader.uploadFile(files);
    const fileList = uploadedFiles.map((el) => {
      return {
        name: el.filename,
        url: el.url,
      };
    });

    const { swMileage, swMileageFiles } =
      await swMileageService.createSwMileageAndFiles(
        createSwMileageDTO,
        fileList
      );

    return res.status(httpStatus.CREATED).json({ swMileage, swMileageFiles });
  } catch (error) {
    throw new ApiError(error.response?.status || 500, error.message);
  }
});

const getSwMileageById = catchAsync(async (req, res) => {
  const { swMileageId } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (
    verifiedPayloadDTO.role === constants.ROLE.STUDENT &&
    swMileage.student_id !== verifiedPayloadDTO.studentId
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  return res.status(httpStatus.OK).json(swMileage);
});

// todo: 개발 필요
const updateSwMileage = catchAsync(async (req, res) => {
  const { swMileageId } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (
    verifiedPayloadDTO.role === constants.ROLE.STUDENT &&
    swMileage.student_id !== verifiedPayloadDTO.studentId
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const updateSwMileageDTO = new UpdateSwMileageDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const updatedSwMileage = await swMileageService.updateSwMileage(
    swMileageId,
    updateSwMileageDTO
  );

  return res.status(httpStatus.OK).json(updatedSwMileage);
});

const updateSwMileageStatus = catchAsync(async (req, res) => {
  const { swMileageId } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const updateSwMileageDTO = new UpdateSwMileageStatusDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const updatedSwMileage = await swMileageService.updateSwMileage(
    swMileageId,
    updateSwMileageDTO
  );

  return res.status(httpStatus.OK).json(updatedSwMileage);
});

// todo: 개발 필요
const deleteSwMileage = catchAsync(async (req, res) => {
  const { swMileageId } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (
    verifiedPayloadDTO.role === constants.ROLE.STUDENT &&
    swMileage.student_id !== verifiedPayloadDTO.studentId
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  await swMileageService.deleteSwMileage(swMileageId);

  return res.sendStatus(httpStatus.NO_CONTENT);
});

const getSwMileageFileList = catchAsync(async (req, res) => {
  // todo: 학생 것만 보도록 validation

  const getSwMileageFileListDTO = new GetSwMileageFileListDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const swMileageList = await swMileageService.getSwMileageFileList(
    getSwMileageFileListDTO
  );

  return res.status(httpStatus.OK).json(swMileageList);
});

const getSwMileageFileById = catchAsync(async (req, res) => {
  const { swMileageFileId } = { ...req.query, ...req.params, ...req.body };

  const swMileageFile = await swMileageService.getSwMileageFileById(
    swMileageFileId
  );
  if (!swMileageFile) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageFile not found");
  }

  // todo: 학생 것만 보도록 validation

  return res.status(httpStatus.OK).json(swMileageFile);
});

const approveSwMileage = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });

  const { swMileageId, rawTransaction } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
  if (!admin || verifiedPayloadDTO.role !== constants.ROLE.ADMIN) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  try{
    await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);
  } catch (error) {
    throw new ApiError(error.response?.status || 500, error.message);
  } 

  return res.status(httpStatus.OK).json({ message: "swMileage approved" });
});

const rejectSwMileage = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });

  const { swMileageId, rawTransaction, comment } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageService.getSwMileageById(swMileageId);
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
  if (!admin || verifiedPayloadDTO.role !== constants.ROLE.ADMIN) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  console.log("enter reject mileage");

  try{
    await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);

    const updateSwMileageDTO = new UpdateSwMileageStatusDTO({
      comment: comment,
      status: constants.SW_MILEAGE_STATUS.DENIED
    });

    console.log(updateSwMileageDTO)

    const result = await swMileageService.updateSwMileage(swMileageId, updateSwMileageDTO);
    console.log(result)
  } catch (error) {
    console.log(error)
    throw new ApiError(error.response?.status || 500, error.message);
  }

  return res.status(httpStatus.OK).json({ message: "swMileage rejected" });
}); 

module.exports = {
  getSwMileageList,
  createSwMileage,
  getSwMileageById,
  updateSwMileage,
  updateSwMileageStatus,
  deleteSwMileage,
  getSwMileageFileList,
  getSwMileageFileById,
  approveSwMileage,
  rejectSwMileage,
};
