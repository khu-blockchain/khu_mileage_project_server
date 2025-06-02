const { Op } = require('sequelize')
const {
    sequelize,
    Student,
    WalletHistory,
} = require('../models')
const { WalletHistoryDto } = require('../dtos/wallet.dto')
const ApiError = require('../utils/ApiError')
const httpStatus = require('http-status')


const getWalletLostList = async (getWalletLostListDTO) => {
    return await WalletHistory.findAll({
        limit: getWalletLostListDTO.limit,

        where: {
            ...(getWalletLostListDTO.last_id !== null && getWalletLostListDTO.last_id !== undefined && { wallet_history_id: { [Op.lt]: getWalletLostListDTO.last_id } }),
        },
        order: [['created_at', 'DESC']],
    })
}

const getWalletLostByStudentId = async (getWalletLostByStudentIdDTO) => {
    return await WalletHistory.findAll({
        limit: getWalletLostByStudentIdDTO.limit,
        where: {
            ...(getWalletLostByStudentIdDTO.last_id !== null && getWalletLostByStudentIdDTO.last_id !== undefined && { wallet_history_id: { [Op.lt]: getWalletLostByStudentIdDTO.last_id } }),
            student_id: getWalletLostByStudentIdDTO.student_id,
        },
        order: [['created_at', 'DESC']],
    })
}


const createWalletLost = async (createWalletHistoryDTO) => {
    const walletHistory = await WalletHistory.create(createWalletHistoryDTO)
    console.log(`createWalletLost: ${JSON.stringify(walletHistory)}`)
    return new WalletHistoryDto(walletHistory)
}

module.exports = {
    getWalletLostList,
    createWalletLost,
    getWalletLostByStudentId,
}
