const catchAsync = require('../utils/catchAsync');
const { swMileageTokenService, studentService, adminService, caverService, swMileageTokenHistoryService } = require("../services");
const uploader = require('../config/fileUploader');
const constants = require('../config/constants');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status')
const {
    GetSwMileageTokenListDTO,
    CreateSwMileageTokenDTO,
    UpdateSwMileageTokenDTO,
} = require('../dtos/swMileageToken.dto');
const {
    VerifiedPayloadDTO,
} = require('../dtos/auth.dto');
const {
    DeployKIP7TokenDTO,
    MintKIP7TokenDTO,
    BurnFromKIP7TokenDTO,
} = require('../dtos/caver.dto');
const { CreateSwMileageTokenHistoryDTO } = require('../dtos/swMileageTokenHistory.dto');
const { sortRank } = require('../utils/rank')
const config = require('../config/config');
const SWMileageABI = require("../utils/data/contract/SwMileageABI.json");
const SWMileageByte = require("../utils/data/contract/SwMileageByte");

const getSwMileageTokenList = catchAsync(async (req, res) => {
    const getSwMileageTokenListDTO = new GetSwMileageTokenListDTO({ ...req.query, ...req.params, ...req.body })
    const swMileageList = await swMileageTokenService.getSwMileageTokenList(getSwMileageTokenListDTO);

    return res.status(httpStatus.OK).json(swMileageList);
})

// only admin
const getSwMileageTokenABIandByteCode = catchAsync(async (req, res) => {
    const contractCode = caverService.getSWMileageContractCode();

    return res.status(httpStatus.OK).json({ result: contractCode });
})

// only admin
const createSwMileageToken = catchAsync(async (req, res) => {
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })

    const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
    }

    // deploy 다시
    const deployKIP7TokenDTO = new DeployKIP7TokenDTO({ ...req.query, ...req.params, ...req.body, name: req.body.swMileageTokenName, deployAddress: admin.wallet_address })

    const KIP7TokenAddress = await caverService.deployCustomKIP7TokenAsFeePayer(req.body.rlpEncodingString)

    const createSwMileageTokenDTO = new CreateSwMileageTokenDTO({
        swMileageTokenName: deployKIP7TokenDTO.name,
        contractAddress: KIP7TokenAddress,
        contractOwnerAddress: deployKIP7TokenDTO.deployAddress,
        description: req.body.description,
        swMileageTokenSymbol: deployKIP7TokenDTO.symbol,
        swMileageTokenDecimals: deployKIP7TokenDTO.decimals,
        swMileageTokenImageUrl: deployKIP7TokenDTO.imageUrl,
        isPaused: constants.SW_MILEAGE_TOKEN.IS_PAUSE.UNPAUSE,
        isActivated: constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.DEACTIVATED,
    })
    const swMileageToken = await swMileageTokenService.createSwMileageToken(createSwMileageTokenDTO)

    return res.status(httpStatus.CREATED).json(swMileageToken);
})

const getSwMileageTokenById = catchAsync(async (req, res) => {
    const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body }

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    return res.status(httpStatus.OK).json(swMileageToken);
})

// only admin
const activateSwMileageToken = catchAsync(async (req, res) => {
    const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body }

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const updatedSwMileageToken = await swMileageTokenService.activateSwMileageToken(swMileageTokenId);

    return res.status(httpStatus.OK).json(updatedSwMileageToken);
})


// todo: 개발 필요
const updateSwMileageToken = catchAsync(async (req, res) => {
    const { swMileageId } = { ...req.query, ...req.params, ...req.body }

    const swMileage = await swMileageTokenService.getSwMileageTokenById(swMileageId);
    if (!swMileage) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileage not found')
    }

    const updateSwMileageTokenDTO = new UpdateSwMileageTokenDTO({ ...req.query, ...req.params, ...req.body })
    const updatedSwMileageToken = await swMileageTokenService.updateSwMileageToken(swMileageId, updateSwMileageTokenDTO);

    return res.status(httpStatus.OK).json(updatedSwMileageToken);
})

// todo: 개발 필요
const deleteSwMileageToken = catchAsync(async (req, res) => {
    const { swMileageTokenId } = { ...req.query, ...req.params, ...req.body }

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageToken not found')
    }

    await swMileageTokenService.deleteSwMileageToken(swMileageTokenId);

    return res.sendStatus(httpStatus.NO_CONTENT);
})

const mintSwMileageToken = catchAsync(async (req, res) => {
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    const { swMileageTokenId, studentId, comment, amount } = { ...req.query, ...req.params, ...req.body }


    // todo: swMileageToken이 isActivate 일때만 작동
    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageToken not found')
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
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
        swMileageTokenId: swMileageToken.sw_mileage_token_id
    })
    const swMileageTokenHistory = await swMileageTokenHistoryService.createSwMileageTokenHistory(createSwMileageTokenHistoryDTO);
    // kip7 mint

    const mintKIP7TokenDTO = new MintKIP7TokenDTO({
        contractAddress: swMileageToken.contract_address,
        spenderAddress: student.wallet_address,
        amount: amount,
        fromAddress: admin.wallet_address,
    })
    const mintKIP7TokenResult = await caverService.mintKIP7Token(mintKIP7TokenDTO)
    await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
        transaction_hash: mintKIP7TokenResult.transactionHash
    })

    // update swMileageTokenHistory success
    if (mintKIP7TokenResult.status === true) {
        const updatedSwMileageTokenHistory = await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
            status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.SUCCESS
        })
        return res.status(httpStatus.OK).json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
    }
    else {
        const updatedSwMileageTokenHistory = await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
            status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.FAIL
        })
        return res.status(httpStatus.OK).json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
    }
})

const burnFromSwMileageToken = catchAsync(async (req, res) => {
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })
    const { swMileageTokenId, studentId, amount, comment } = { ...req.query, ...req.params, ...req.body }

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageToken not found')
    }

    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    const admin = await adminService.getAdminByPK(verifiedPayloadDTO.adminId);
    if (!admin) {
        throw new ApiError(httpStatus.NOT_FOUND, 'admin not found')
    }

    const allowanceValue = await caverService.allowanceKIP7Token(student.wallet_address, admin.wallet_address, swMileageToken.contract_address)
    const studentApproveAmount = await caverService.toBN(allowanceValue);
    const maxApproveAmount = await caverService.toBN(constants.MAX_APPROVE_AMOUNT);
    if (!studentApproveAmount.eq(maxApproveAmount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "approve amount error")
    }

    const balanceOfKIP7Token = await caverService.balanceOfKIP7Token(student.wallet_address, swMileageToken.contract_address)
    if (parseInt(await caverService.fromPeb(balanceOfKIP7Token, constants.PEB_UNIT.KLAY)) < amount) {
        throw new ApiError(httpStatus.CONFLICT, 'balance error')
    }
    // swMileageTokenHistory create
    const createSwMileageTokenHistoryDTO = new CreateSwMileageTokenHistoryDTO({
        amount: amount,
        transactionType: constants.SW_MILEAGE_TOKEN_HISTORY.TRANSACTION_TYPE.BURN_FROM,
        studentAddress: student.wallet_address,
        studentId: student.student_id,
        adminAddress: admin.wallet_address,
        adminId: admin.admin_id,
        comment: comment,
        swMileageTokenId: swMileageToken.sw_mileage_token_id
    })
    const swMileageTokenHistory = await swMileageTokenHistoryService.createSwMileageTokenHistory(createSwMileageTokenHistoryDTO);
    // kip7 mint
    const burnFromKIP7TokenDTO = new BurnFromKIP7TokenDTO({
        contractAddress: swMileageToken.contract_address,
        spenderAddress: student.wallet_address,
        amount: amount,
        fromAddress: admin.wallet_address,
    })
    const mintKIP7TokenResult = await caverService.burnFromKIP7Token(burnFromKIP7TokenDTO)
    await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
        transaction_hash: mintKIP7TokenResult.transactionHash
    })

    // update swMileageTokenHistory success
    if (mintKIP7TokenResult.status === true) {
        const updatedSwMileageTokenHistory = await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
            status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.SUCCESS
        })
        return res.status(httpStatus.OK).json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
    }
    else {
        const updatedSwMileageTokenHistory = await swMileageTokenHistoryService.updateSwMileageTokenHistory(swMileageTokenHistory.sw_mileage_token_history_id, {
            status: constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.FAIL
        })
        return res.status(httpStatus.OK).json({ swMileageTokenHistory: updatedSwMileageTokenHistory });
    }
})

const approveSwMileageToken = catchAsync(async (req, res) => {
    // todo : approve 트렌젝션도 token history 내역에 저장하기
    const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload })

    const { swMileageTokenId, studentId, rawTransaction } = { ...req.params, ...req.body }
    const student = await studentService.getStudentById(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, 'student not found')
    }

    if (verifiedPayloadDTO.role === constants.ROLE.STUDENT && studentId !== verifiedPayloadDTO.studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client")
    }

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId);
    if (!swMileageToken) {
        throw new ApiError(httpStatus.NOT_FOUND, 'swMileageToken not found')
    }

    // TODO: 향후 admin이 늘어나면 코드 수정
    const adminAddress = config.kaia.adminAddress

    // rawTransaction을 깐뒤에 student와 swMileageToken정보와 일치하는지 확인
    const decodedTransaction = await caverService.decodeRawTransaction(rawTransaction)
    const decodedInput = await caverService.decodeApproveABI(decodedTransaction._input)
    if (decodedTransaction._type !== "TxTypeFeeDelegatedSmartContractExecution") {
        throw new ApiError(httpStatus.BAD_REQUEST, "transaction type error")
    }
    if (decodedTransaction._from.toUpperCase() !== student.wallet_address.toUpperCase()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "transaction from error")
    }
    if (decodedTransaction._to.toUpperCase() !== swMileageToken.contract_address.toUpperCase()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "transaction to error")
    }
    if (decodedInput.spender.toUpperCase() !== adminAddress.toUpperCase()) {
        throw new ApiError(httpStatus.BAD_REQUEST, "spender is not admin address")
    }

    const inputApproveAmount = await caverService.toBN(decodedInput.value);
    const maxApproveAmount = await caverService.toBN(constants.MAX_APPROVE_AMOUNT);
    if (!inputApproveAmount.eq(maxApproveAmount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "approve amount error")
    }

    const result = await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction)
    return res.json({ result })
})


const getApproveSwMileageTokenData = catchAsync(async (req, res) => {
    // todo: 향후 admin 추가로 생길시 처리
    return res.json({
        spenderAddress: config.kaia.adminAddress,
        approveAmount: constants.MAX_APPROVE_AMOUNT
    })
})

const getStudentsRankingRange = catchAsync(async (req, res) => {
    const {from, to, swMileageTokenId} = {...req.query, ...req.params, ...req.body}
    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId)

    const rankList = await caverService.getStudentsRankingRange(from, to, swMileageToken.contract_address)
    
    const walletList = rankList.map((data) => {
        return data.account
    })

    const studentList = await studentService.getStudentListByWalletAddressList(walletList)
    const result = sortRank(rankList, studentList, from)

    return res.json({ result })
})

const addSwmileageTokenFeePayer = catchAsync(async (req, res) => {
    const { swMileageTokenId, rawTransaction } = {...req.query, ...req.params, ...req.body}

    const swMileageToken = await swMileageTokenService.getSwMileageTokenById(swMileageTokenId)

    const result = await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction)

    // TODO: FeePayer가 모든 admin추가

    return res.status(httpStatus.NO_CONTENT)
})

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
}