const { Op } = require("sequelize");
const { sequelize, Student, WalletHistory } = require("../models");
const { WalletHistoryDto } = require("../dtos/wallet.dto");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const getWalletLostList = async (getWalletLostListDTO) => {
  return await WalletHistory.findAll({
    // limit: getWalletLostListDTO.limit,

    where: {
      ...(getWalletLostListDTO.last_id !== null &&
        getWalletLostListDTO.last_id !== undefined && {
          wallet_history_id: { [Op.lt]: getWalletLostListDTO.last_id },
        }),
    },
    order: [["created_at", "DESC"]],
  });
};

const checkHasNotConfirmedWalletLost = async (studentId) => {
  return await WalletHistory.findOne({
    where: {
      student_id: studentId,
      is_confirmed: 0,
    },
  });
};

const getWalletLostByStudentId = async (getWalletLostByStudentIdDTO) => {
  return await WalletHistory.findAll({
    // limit: getWalletLostByStudentIdDTO.limit,
    where: {
      ...(getWalletLostByStudentIdDTO.last_id !== null &&
        getWalletLostByStudentIdDTO.last_id !== undefined && {
          wallet_history_id: { [Op.lt]: getWalletLostByStudentIdDTO.last_id },
        }),
      student_id: getWalletLostByStudentIdDTO.student_id,
    },
    order: [["created_at", "DESC"]],
  });
};

const getWalletLostById = async (walletHistoryId) => {
  const walletHistory = await WalletHistory.findOne({
    where: {
      wallet_history_id: walletHistoryId,
    },
  });
  if (!walletHistory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Wallet history not found");
  }
  return new WalletHistoryDto(walletHistory);
};

const createWalletLost = async (createWalletHistoryDTO) => {
  const walletHistory = await WalletHistory.create(createWalletHistoryDTO);
  console.log(`createWalletLost: ${JSON.stringify(walletHistory)}`);
  return new WalletHistoryDto(walletHistory);
};

module.exports = {
  getWalletLostList,
  createWalletLost,
  getWalletLostByStudentId,
  getWalletLostById,
  checkHasNotConfirmedWalletLost,
};
