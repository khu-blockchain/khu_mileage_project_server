const catchAsync = require("../utils/catchAsync");
const {
  swMileageTokenService,
  studentService,
  adminService,
  caverService,
  swMileageTokenHistoryService,
  swMileageService
} = require("../services");
const uploader = require("../config/fileUploader");
const constants = require("../config/constants");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const {
  GetSwMileageTokenListDTO,
  CreateSwMileageTokenDTO,
  UpdateSwMileageTokenDTO,
} = require("../dtos/swMileageToken.dto");
const { VerifiedPayloadDTO } = require("../dtos/auth.dto");
const {
  DeployKIP7TokenDTO,
  MintKIP7TokenDTO,
  BurnFromKIP7TokenDTO,
} = require("../dtos/caver.dto");
const {
  CreateSwMileageTokenHistoryDTO,
} = require("../dtos/swMileageTokenHistory.dto");
const { sortRank } = require("../utils/rank");
const config = require("../config/config");
const SWMileageABI = require("../utils/data/contract/SwMileageABI.json");
const SWMileageByte = require("../utils/data/contract/SwMileageByte");
const { addAdminByFeePayer } = require("../services/caver.service");

const getSwMileageTokenList = catchAsync(async (req, res) => {
  // 모든 마일리지 토큰 조회, limit 필요 없음
  const getSwMileageTokenListDTO = new GetSwMileageTokenListDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const swMileageList = await swMileageTokenService.getSwMileageTokenList(
    getSwMileageTokenListDTO
  );

  return res.status(httpStatus.OK).json(swMileageList);
});

// only admin
const getSwMileageTokenABIandByteCode = catchAsync(async (req, res) => {
  const contractCode = caverService.getSWMileageContractCode();

  return res.status(httpStatus.OK).json(contractCode);
});

// only admin
const createSwMileageToken = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });

  const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  const { rawTransaction } = { ...req.body };
  // TokenFactory Contract의 deploy 메소드를 통해 토큰 생성

  const receipt = await caverService.sendRawTransactionWithSignAsFeePayer(
    rawTransaction
  );
  console.log(receipt);
  const { logs } = receipt;
  console.log(logs);
  const { address } = logs[0];
  console.log(address);

  // deploy 다시
  const deployKIP7TokenDTO = new DeployKIP7TokenDTO({
    ...req.query,
    ...req.params,
    ...req.body,
    name: req.body.swMileageTokenName,
    deployAddress: admin.wallet_address,
  });

  const createSwMileageTokenDTO = new CreateSwMileageTokenDTO({
    swMileageTokenName: deployKIP7TokenDTO.name,
    contractAddress: address,
    contractOwnerAddress: deployKIP7TokenDTO.deployAddress,
    description: req.body.description,
    swMileageTokenSymbol: deployKIP7TokenDTO.symbol,
    swMileageTokenDecimals: deployKIP7TokenDTO.decimals,
    swMileageTokenImageUrl: deployKIP7TokenDTO.imageUrl,
    transactionHash: receipt.transactionHash,
    // isPaused: constants.SW_MILEAGE_TOKEN.IS_PAUSE.UNPAUSE,
    // isActivated: constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.DEACTIVATED,
  });
  const swMileageToken = await swMileageTokenService.createSwMileageToken(
    createSwMileageTokenDTO
  );

  return res.status(httpStatus.CREATED).json(swMileageToken);
});

const getSwMileageTokenById = catchAsync(async (req, res) => {
  const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body };

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  return res.status(httpStatus.OK).json(swMileageToken);
});

// only admin
const activateSwMileageToken = catchAsync(async (req, res) => {
  const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body };

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const recipt = await caverService.sendRawTransactionWithSignAsFeePayer(
    req.body.rawTransaction
  );
  console.log(recipt);

  return res.status(httpStatus.OK).json({ success: true });
});

// todo: 개발 필요
const updateSwMileageToken = catchAsync(async (req, res) => {
  const { swMileageId } = { ...req.query, ...req.params, ...req.body };

  const swMileage = await swMileageTokenService.getSwMileageTokenById(
    swMileageId
  );
  if (!swMileage) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileage not found");
  }

  const updateSwMileageTokenDTO = new UpdateSwMileageTokenDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const updatedSwMileageToken =
    await swMileageTokenService.updateSwMileageToken(
      swMileageId,
      updateSwMileageTokenDTO
    );

  return res.status(httpStatus.OK).json(updatedSwMileageToken);
});

// todo: 개발 필요
const deleteSwMileageToken = catchAsync(async (req, res) => {
  const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body };

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageToken not found");
  }

  await swMileageTokenService.deleteSwMileageToken(swMileageTokenId);

  return res.sendStatus(httpStatus.NO_CONTENT);
});

const mintSwMileageToken = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  const { swMileageTokenId, studentId, comment, amount, rawTransaction } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };

  // todo: swMileageToken이 isActivate 일때만 작동
  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageToken not found");
  }

  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  // swMileageTokenHistory create
  const createSwMileageTokenHistoryDTO = new CreateSwMileageTokenHistoryDTO({
    amount: amount,
    transactionType: constants.SW_MILEAGE_TOKEN_HISTORY.TRANSACTION_TYPE.MINT,
    studentId: student.student_id,
    studentAddress: student.wallet_address,
    adminId: admin.admin_id,
    adminAddress: admin.wallet_address,
    comment: comment,
    swMileageTokenId: swMileageToken.sw_mileage_token_id,
  });
  const swMileageTokenHistory =
    await swMileageTokenHistoryService.createSwMileageTokenHistory(
      createSwMileageTokenHistoryDTO
    );
  // kip7 mint

  const mintKIP7TokenDTO = new MintKIP7TokenDTO({
    contractAddress: swMileageToken.contract_address,
    spenderAddress: student.wallet_address,
    amount: amount,
    fromAddress: admin.wallet_address,
  });
  // const mintKIP7TokenResult = await caverService.mintKIP7Token(mintKIP7TokenDTO) feePayer서명만 처리 하도록 변경
  const mintKIP7TokenReceipt =
    await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);
  console.log(`mintKIP7TokenReceipt : ${mintKIP7TokenReceipt}`);

  await swMileageTokenHistoryService.updateSwMileageTokenHistory(
    swMileageTokenHistory.sw_mileage_token_history_id,
    {
      transaction_hash: mintKIP7TokenReceipt.transactionHash,
    }
  );

  // update swMileageTokenHistory success
  if (mintKIP7TokenReceipt.status === true) {
    const updatedSwMileageTokenHistory =
      await swMileageTokenHistoryService.updateSwMileageTokenHistory(
        swMileageTokenHistory.sw_mileage_token_history_id,
        {
          status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.SUCCESS,
        }
      );
    return res
      .status(httpStatus.OK)
      .json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
  } else {
    const updatedSwMileageTokenHistory =
      await swMileageTokenHistoryService.updateSwMileageTokenHistory(
        swMileageTokenHistory.sw_mileage_token_history_id,
        {
          status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.FAIL,
        }
      );
    return res
      .status(httpStatus.OK)
      .json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
  }
});

const burnFromSwMileageToken = catchAsync(async (req, res) => {
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  const { swMileageTokenId, studentId, amount, comment, rawTransaction } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageToken not found");
  }

  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  // 현재 Contract에서는 Admin이 Student 의 토큰 burn할 수 있도록 처리 중
  // const allowanceValue = await caverService.allowanceKIP7Token(student.wallet_address, admin.wallet_address, swMileageToken.contract_address)
  // const studentApproveAmount = await caverService.toBN(allowanceValue);
  // const maxApproveAmount = await caverService.toBN(constants.MAX_APPROVE_AMOUNT);
  // if (!studentApproveAmount.eq(maxApproveAmount)) {
  //     throw new ApiError(httpStatus.BAD_REQUEST, "approve amount error")
  // }

  const balanceOfKIP7Token = await caverService.balanceOfKIP7Token(
    student.wallet_address,
    swMileageToken.contract_address
  );

  // TODO :단위 처리 다시
  // if (parseInt(await caverService.fromPeb(balanceOfKIP7Token, constants.PEB_UNIT.KLAY)) < amount) {
  //     throw new ApiError(httpStatus.CONFLICT, 'balance error')
  // }

  const createSwMileageTokenHistoryDTO = new CreateSwMileageTokenHistoryDTO({
    amount: amount,
    transactionType:
      constants.SW_MILEAGE_TOKEN_HISTORY.TRANSACTION_TYPE.BURN_FROM,
    studentAddress: student.wallet_address,
    studentId: student.student_id,
    adminAddress: admin.wallet_address,
    adminId: admin.admin_id,
    comment: comment,
    swMileageTokenId: swMileageToken.sw_mileage_token_id,
  });
  const swMileageTokenHistory =
    await swMileageTokenHistoryService.createSwMileageTokenHistory(
      createSwMileageTokenHistoryDTO
    );

  const burnKIP7TokenReceipt =
    await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);
  await swMileageTokenHistoryService.updateSwMileageTokenHistory(
    swMileageTokenHistory.sw_mileage_token_history_id,
    {
      transaction_hash: burnKIP7TokenReceipt.transactionHash,
    }
  );

  // update swMileageTokenHistory success
  if (burnKIP7TokenReceipt.status === true) {
    const updatedSwMileageTokenHistory =
      await swMileageTokenHistoryService.updateSwMileageTokenHistory(
        swMileageTokenHistory.sw_mileage_token_history_id,
        {
          status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.SUCCESS,
        }
      );
    return res
      .status(httpStatus.OK)
      .json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
  } else {
    const updatedSwMileageTokenHistory =
      await swMileageTokenHistoryService.updateSwMileageTokenHistory(
        swMileageTokenHistory.sw_mileage_token_history_id,
        {
          status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.FAIL,
          comment: comment,
        }
      );
    return res
      .status(httpStatus.OK)
      .json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
  }
});

// 현재 Contract에서 필요x (legacy code)
const approveSwMileageToken = catchAsync(async (req, res) => {
  // todo : approve 트렌젝션도 token history 내역에 저장하기
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });

  const { swMileageTokenId, studentId, rawTransaction } = {
    ...req.params,
    ...req.body,
  };
  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  if (
    verifiedPayloadDTO.role === constants.ROLE.STUDENT &&
    studentId !== verifiedPayloadDTO.studentId
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageToken not found");
  }

  // TODO: 향후 admin이 늘어나면 코드 수정
  const adminAddress = config.kaia.adminAddress;

  // rawTransaction을 깐뒤에 student와 swMileageToken정보와 일치하는지 확인
  const decodedTransaction = await caverService.decodeRawTransaction(
    rawTransaction
  );
  const decodedInput = await caverService.decodeApproveABI(
    decodedTransaction._input
  );
  if (decodedTransaction._type !== "TxTypeFeeDelegatedSmartContractExecution") {
    throw new ApiError(httpStatus.BAD_REQUEST, "transaction type error");
  }
  if (
    decodedTransaction._from.toUpperCase() !==
    student.wallet_address.toUpperCase()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "transaction from error");
  }
  if (
    decodedTransaction._to.toUpperCase() !==
    swMileageToken.contract_address.toUpperCase()
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "transaction to error");
  }
  if (decodedInput.spender.toUpperCase() !== adminAddress.toUpperCase()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "spender is not admin address");
  }

  const inputApproveAmount = await caverService.toBN(decodedInput.value);
  const maxApproveAmount = await caverService.toBN(
    constants.MAX_APPROVE_AMOUNT
  );
  if (!inputApproveAmount.eq(maxApproveAmount)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "approve amount error");
  }

  const result = await caverService.sendRawTransactionWithSignAsFeePayer(
    rawTransaction
  );
  return res.json({ result });
});

const approveRejectSwMileageToken = catchAsync(async (req, res) => {
  // todo : approve 트렌젝션도 token history 내역에 저장하기
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });

  const { swMileageTokenId, studentId,swMileageId, comment, adminId, rawTransaction } = {
    ...req.params,
    ...req.body,
  };
  amount = 0
  console.log("approveRejectSwMileageToken", {
    swMileageTokenId,
    studentId,
    amount,
    adminId,
    swMileageId,
    comment,
    rawTransaction,
  });
  const student = await studentService.getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  if (
    verifiedPayloadDTO.role === constants.ROLE.ADMIN &&
    adminId !== verifiedPayloadDTO.adminId
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );
  if (!swMileageToken) {
    throw new ApiError(httpStatus.NOT_FOUND, "swMileageToken not found");
  }

  const receipt = await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);
  console.log("receipt", receipt);
  const createSwMileageTokenHistoryDTO = new CreateSwMileageTokenHistoryDTO({
    amount: amount,
    transactionType: constants.SW_MILEAGE_TOKEN_HISTORY.TRANSACTION_TYPE.REJECT,
    studentId: student.student_id,
    swMileageId: swMileageId,
    studentAddress: student.wallet_address,
    adminId: admin.admin_id,
    adminAddress: admin.wallet_address,
    comment: comment,
    swMileageTokenId: swMileageToken.sw_mileage_token_id,
    transactionHash: receipt.transactionHash,
  });

  const swMileageTokenHistory =
    await swMileageTokenHistoryService.createSwMileageTokenHistory(
      createSwMileageTokenHistoryDTO
    );

    const updatedSwMileage = await swMileageService.updateSwMileage(
      swMileageId,
      {
        status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.FAIL,
        comment: comment,
      }
    );
  

  return res.status(httpStatus.CREATED).json({ swMileageTokenHistory });
});

const getApproveSwMileageTokenData = catchAsync(async (req, res) => {
  // todo: 향후 admin 추가로 생길시 처리
  return res.json({
    spenderAddress: config.kaia.adminAddress,
    approveAmount: constants.MAX_APPROVE_AMOUNT,
  });
});

const getStudentsRankingRange = catchAsync(async (req, res) => {
  const { from, to, swMileageTokenId } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };
  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );

  const rankList = await caverService.getStudentsRankingRange(
    from,
    to,
    swMileageToken.contract_address
  );

  const walletList = rankList.map((data) => {
    return data.account;
  });

  const studentList = await studentService.getStudentListByWalletAddressList(
    walletList
  );
  const result = sortRank(rankList, studentList, from);

  return res.json({ result });
});

const addSwmileageTokenFeePayer = catchAsync(async (req, res) => {
  const { swMileageTokenId, rawTransaction } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };

  const swMileageToken = await swMileageTokenService.getSwMileageTokenById(
    swMileageTokenId
  );

  const receipt = await caverService.sendRawTransactionWithSignAsFeePayer(
    rawTransaction
  );

  // TODO: FeePayer가 모든 admin추가
  // const adminList = await adminService.getAdminList();

  // for (const admin of adminList) {
  //    // 추후 한번에 업데이트 하는 contract method 있으면 효율적
  //
  //    await caverService.addAdminByFeePayer(admin.wallet_address, swMileageToken.contract_address)
  // }

  return res.sendStatus(httpStatus.OK);
});

const getActivateSwmileagetoken = catchAsync(async (req, res) => {
  const activateSwMileageToken =
    await swMileageTokenService.getActivateSwMileagetoken();
  return res.json(activateSwMileageToken);
});

module.exports = {
  getSwMileageTokenList,
  createSwMileageToken,
  getSwMileageTokenById,
  updateSwMileageToken,
  deleteSwMileageToken,
  activateSwMileageToken,
  mintSwMileageToken,
  burnFromSwMileageToken,
  approveSwMileageToken,
  getApproveSwMileageTokenData,
  getStudentsRankingRange,
  addSwmileageTokenFeePayer,

  getSwMileageTokenABIandByteCode,
  getActivateSwmileagetoken,
  approveRejectSwMileageToken
};
