const { Op } = require("sequelize");
const { sequelize, SwMileageTokenHistory } = require("../models");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");

const getSwMileageTokenHistoryList = async (
  getSwMileageTokenHistoryListDTO
) => {
  return await SwMileageTokenHistory.findAll({
    where: {
      ...(getSwMileageTokenHistoryListDTO.sw_mileage_token_id !== null &&
        getSwMileageTokenHistoryListDTO.sw_mileage_token_id !== undefined && {
          sw_mileage_token_id:
            getSwMileageTokenHistoryListDTO.sw_mileage_token_id,
        }),
      ...(getSwMileageTokenHistoryListDTO.type !== null &&
        getSwMileageTokenHistoryListDTO.type !== undefined && {
          type: Array.isArray(getSwMileageTokenHistoryListDTO.type)
            ? { [Op.in]: getSwMileageTokenHistoryListDTO.type }
            : getSwMileageTokenHistoryListDTO.type,
        }),
      ...(getSwMileageTokenHistoryListDTO.admin_address !== null &&
        getSwMileageTokenHistoryListDTO.admin_address !== undefined && {
          admin_address: getSwMileageTokenHistoryListDTO.admin_address,
        }),
      ...(getSwMileageTokenHistoryListDTO.student_address !== null &&
        getSwMileageTokenHistoryListDTO.student_address !== undefined && {
          student_address: getSwMileageTokenHistoryListDTO.student_address,
        }),
      ...(getSwMileageTokenHistoryListDTO.student_id !== null &&
        getSwMileageTokenHistoryListDTO.student_id !== undefined && {
          student_id: getSwMileageTokenHistoryListDTO.student_id,
        }),
      ...(getSwMileageTokenHistoryListDTO.last_id &&
        getSwMileageTokenHistoryListDTO.order && {
          ...(getSwMileageTokenHistoryListDTO.order === "ASC"
            ? {
                sw_mileage_token_history_id: {
                  [Op.gt]: getSwMileageTokenHistoryListDTO.last_id,
                },
              }
            : {
                sw_mileage_token_history_id: {
                  [Op.lt]: getSwMileageTokenHistoryListDTO.last_id,
                },
              }),
        }),
    },
    limit: getSwMileageTokenHistoryListDTO.limit,
    offset: getSwMileageTokenHistoryListDTO.offset,
    ...(getSwMileageTokenHistoryListDTO.order && {
      order: [
        [
          "sw_mileage_token_history_id",
          getSwMileageTokenHistoryListDTO.order.toUpperCase(),
        ],
      ],
    }),
    order: [["created_at", "DESC"]],
  });
};

const getSwMileageTokenHistoryById = async (swMileageTokenHistoryId) => {
  const swMileageTokenHistory = await SwMileageTokenHistory.findOne({
    where: {
      sw_mileage_token_history_id: swMileageTokenHistoryId,
    },
  });

  if (!swMileageTokenHistory) {
    return null;
  }

  return swMileageTokenHistory;
};

const getSwMileageTokenHistoryByTransactionHash = async (transactionHash) => {
  const swMileageTokenHistory = await SwMileageTokenHistory.findOne({
    where: {
      transaction_hash: transactionHash,
    },
  });

  if (!swMileageTokenHistory) {
    return null;
  }

  return swMileageTokenHistory;
};

const createSwMileageTokenHistory = async (
  createSwMileageTokenHistoryDTO,
  transaction = null
) => {
  const swMileageTokenHistory = await SwMileageTokenHistory.create(
    createSwMileageTokenHistoryDTO,
    {
      transaction,
    }
  );

  // return new SwMileageTokenHistoryDTO(swMileageTokenHistory)
  return swMileageTokenHistory;
};

const updateSwMileageTokenHistory = async (
  swMileageTokenHistoryId,
  updateSwMileageTokenHistoryDTO
) => {
  await SwMileageTokenHistory.update(updateSwMileageTokenHistoryDTO, {
    where: {
      sw_mileage_token_history_id: swMileageTokenHistoryId,
    },
  });

  return await SwMileageTokenHistory.findOne({
    where: {
      sw_mileage_token_history_id: swMileageTokenHistoryId,
    },
  });
};

const deleteSwMileageTokenHistory = async (swMileageTokenHistoryId) => {
  const result = await SwMileageTokenHistory.destroy({
    where: {
      sw_mileage_token_history_id: swMileageTokenHistoryId,
    },
  });

  if (!result) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "delete swMileageTokenHistory failed"
    );
  }

  return result;
};

module.exports = {
  getSwMileageTokenHistoryList,
  getSwMileageTokenHistoryById,
  getSwMileageTokenHistoryByTransactionHash,
  createSwMileageTokenHistory,
  updateSwMileageTokenHistory,
  deleteSwMileageTokenHistory,
};
