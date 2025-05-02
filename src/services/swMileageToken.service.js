const {
    sequelize,
    SwMileageToken,
} = require('../models')
const { SwMileageTokenDTO } = require('../dtos/swMileageToken.dto')
const ApiError = require('../utils/ApiError')
const httpStatus = require('http-status')
const constants = require('../config/constants')
const { Op } = require('sequelize');

const getSwMileageTokenList = async (getSwMileageTokenListDTO) => {
    return await SwMileageToken.findAll({
        where: {
            ...(getSwMileageTokenListDTO.status !== null && getSwMileageTokenListDTO.status !== undefined && { status: getSwMileageTokenListDTO.status }),
            ...(getSwMileageTokenListDTO.student_id !== null && getSwMileageTokenListDTO.student_id !== undefined && { student_id: getSwMileageTokenListDTO.student_id }),
        },
        limit: getSwMileageTokenListDTO.limit,
        offset: getSwMileageTokenListDTO.offset,
        order: [['created_at', 'DESC']],
    })
}

const getSwMileageTokenById = async (swMileageTokenId) => {
    const swMileageToken = await SwMileageToken.findOne({
        where: {
            sw_mileage_token_id: swMileageTokenId,
        }
    })

    if (!swMileageToken) {
        return null
    }

    return swMileageToken
}

const createSwMileageToken = async (createSwMileageTokenDTO, transaction = null) => {
    const swMileageToken = await SwMileageToken.create(createSwMileageTokenDTO, {
        transaction,
    },)

    // return new SwMileageTokenDTO(swMileageToken)
    return swMileageToken
}

const updateSwMileageToken = async (swMileageTokenId, updateSwMileageTokenDTO) => {
    await SwMileageToken.update(updateSwMileageTokenDTO, {
        where: {
            sw_mileage_token_id: swMileageTokenId,
        },
    })

    return await SwMileageToken.findOne({
        where: {
            sw_mileage_token_id: swMileageTokenId,
        }
    })
}

const deleteSwMileageToken = async (swMileageTokenId) => {
    const result = await SwMileageToken.destroy({
        where: {
            sw_mileage_token_id: swMileageTokenId,
        }
    })

    if (!result) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "delete swMileageToken failed")
    }

    return result
}

// 활성화 되는 토큰은 1개만 존재
const activateSwMileageToken = async (swMileageTokenId) => {
    return await sequelize.transaction(async (transaction) => {
        await SwMileageToken.update(
            {
                is_activated: constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.DEACTIVATED
            },
            {
                where: {
                    is_activated: constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.ACTIVATED,
                    sw_mileage_token_id: {
                        [Op.ne]: swMileageTokenId
                    }
                }
            },
            transaction,
        );
        await SwMileageToken.update(
            {
                is_activated: constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.ACTIVATED
            },
            {
                where: {
                    sw_mileage_token_id: swMileageTokenId,
                },
            },
            transaction,
        )
        return await SwMileageToken.findOne({
            where: {
                sw_mileage_token_id: swMileageTokenId,
            }
        })
    })
}

const getActivateSwMileagetoken = async () => {
    const token = await SwMileageToken.findOne({
        where: {
            is_activated : constants.SW_MILEAGE_TOKEN.IS_ACTIVATED.ACTIVATED,
        },
    })

    return token
}

module.exports = {
    getSwMileageTokenList,
    getSwMileageTokenById,
    createSwMileageToken,
    updateSwMileageToken,
    deleteSwMileageToken,
    activateSwMileageToken,
    getActivateSwMileagetoken,
}
