const catchAsync = require("../utils/catchAsync");
const { studentService, walletService } = require("../services");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const {
  GetWalletLostListDTO,
  CreateWalletLostDTO,
  GetWalletLostByStudentIdDTO,
} = require("../dtos/wallet.dto");
const constants = require("../config/constants");
const { VerifiedPayloadDTO } = require("../dtos/auth.dto");
const caverService = require("../services/caver.service");

const getWalletLostList = catchAsync(async (req, res) => {
  const getWalletLostListDTO = new GetWalletLostListDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  console.log(`getWalletLostListDTO: ${JSON.stringify(getWalletLostListDTO)}`);
  const walletLostList = await walletService.getWalletLostList(
    getWalletLostListDTO
  );

  return res.status(httpStatus.OK).json({
    total: walletLostList.length,
    list: walletLostList,
  });
});

const createWalletLost = catchAsync(async (req, res) => {
  const { studentId } = { ...req.query, ...req.params, ...req.body };
  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }
  const hasNotConfirmedWalletLost =
    await walletService.checkHasNotConfirmedWalletLost(studentId);
  if (hasNotConfirmedWalletLost) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "already has not confirmed wallet lost"
    );
  }

  const createWalletLostDTO = new CreateWalletLostDTO({
    ...req.query,
    ...req.params,
    ...req.body,
    name: student.name,
    student_hash: student.student_hash,
    walletAddress: student.wallet_address,
  });
  const walletLost = await walletService.createWalletLost(createWalletLostDTO);

  return res.status(httpStatus.CREATED).json({
    ...walletLost,
  });
});

const checkHasNotConfirmedWalletLost = catchAsync(async (req, res) => {
  const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload };
  const { studentId } = { ...req.query, ...req.params, ...req.body };
  if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }
  const hasNotConfirmedWalletLost =
    await walletService.checkHasNotConfirmedWalletLost(studentId);
  return res.status(httpStatus.OK).json({
    result: hasNotConfirmedWalletLost ? true : false,
    data: hasNotConfirmedWalletLost ? hasNotConfirmedWalletLost : null,
  });
});

const getWalletLostByStudentId = catchAsync(async (req, res) => {
  console.log("11111111111111111");
  const { role, studentId: verifiedStudentId } = { ...req.verifiedPayload };
  const { studentId } = { ...req.query, ...req.params, ...req.body };
  if (role === constants.ROLE.STUDENT && verifiedStudentId !== studentId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  const getWalletLostByStudentIdDTO = new GetWalletLostByStudentIdDTO({
    ...req.query,
    ...req.params,
    ...req.body,
    studentId: student.student_id,
  });
  console.log(
    `getWalletLostByStudentIdDTO: ${JSON.stringify(
      getWalletLostByStudentIdDTO
    )}`
  );
  const walletLost = await walletService.getWalletLostByStudentId(
    getWalletLostByStudentIdDTO
  );

  return res.status(httpStatus.OK).json(walletLost);
});

const approveWalletLost = catchAsync(async (req, res) => {
  const verifiedPayload = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (verifiedPayload.role !== constants.ROLE.ADMIN) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const { walletHistoryId, studentId, rawTransaction } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };
  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }
  const walletLost = await walletService.getWalletLostById(walletHistoryId);
  if (!walletLost) {
    throw new ApiError(httpStatus.NOT_FOUND, "wallet lost not found");
  }

  try {
    console.log("enter try catch");

    const receipt = await caverService.sendRawTransactionWithSignAsFeePayer(
      rawTransaction
    );
    console.log(receipt);
    return res.status(httpStatus.OK).json(walletLost);
  } catch (error) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to approve wallet lost",
      error
    );
  }
});

module.exports = {
  getWalletLostList,
  createWalletLost,
  getWalletLostByStudentId,
  approveWalletLost,
  checkHasNotConfirmedWalletLost,
};
