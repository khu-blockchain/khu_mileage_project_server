const {
    sequelize,
    Admin,
} = require('../models')
const { AdminDTO } = require('../dtos/admin.dto')
const ApiError = require('../utils/ApiError')
const httpStatus = require('http-status')
const config = require('../config/config')
const constants = require('../config/constants')
const md5 = require('md5')

const getAdminList = async (getAdminListDTO) => {
    return await Admin.findAll({
        attributes: {
            exclude: ['password', 'salt'],
        },
        limit: getAdminListDTO.limit,
        offset: getAdminListDTO.offset,
        where: {},
        order: [['created_at', 'DESC']],
    })
}

const getAdminById = async (id) => {
    const admin = await Admin.findOne({
        where: {
            id: id,
        }
    })

    if (!admin) {
        return null
    }

    return new AdminDTO(admin)
}

const getAdminByPK = async (adminId) => {
    const admin = await Admin.findByPk(adminId)

    if (!admin) {
        return null
    }

    return new AdminDTO(admin)
}

const getAdminPasswordAndSaltById = async (id) => {
    const admin = await Admin.findOne({
        where: {
            id: id,
        }
    })

    if (!admin) {
        return null
    }

    return {
        salt: admin.salt,
        password: admin.password
    }
}

const getAdminByWalletAddress = async (walletAddress) => {
    const admin = await Admin.findOne({
        where: {
            wallet_address: walletAddress,
        }
    })

    if (!admin) {
        return null
    }

    return new AdminDTO(admin)
}

const createAdmin = async (createAdminDTO) => {
    const admin = await Admin.create(createAdminDTO)

    return new AdminDTO(admin)
}

const findAndCreateRootAdmin = async () => {
    const rootAdmin = await Admin.findOne({
        where: {
            id: config.rootAdmin.id,
        }
    })

    if (!rootAdmin) {
        const md5password = md5(config.rootAdmin.password)
        const salt = config.rootAdmin.salt
        const hashPassword = md5(`khu${salt}${md5password}${salt}mileage`)

        await Admin.create({
            id: config.rootAdmin.id,
            password: hashPassword,
            salt: config.rootAdmin.salt,
            name: config.rootAdmin.name,
            wallet_address: config.klaytn.adminAddress,
            role: constants.ROLE.ROOT_ADMIN,
        })
    }

    return true
}

const updateAdmin = async (adminId, updateAdminDTO) => {
    return await Admin.update(updateAdminDTO, {
        where: {
            admin_id: adminId,
        },
        returning: true,
        plain: true
    })
}

const deleteAdmin = async (adminId) => {
    const result = await Admin.destroy({
        where: {
            admin_id: adminId,
        }
    })

    if (!result) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "delete admin failed")
    }

    return result
}

module.exports = {
    getAdminList,
    getAdminById,
    getAdminByPK,
    getAdminByWalletAddress,
    getAdminPasswordAndSaltById,
    createAdmin,
    findAndCreateRootAdmin,
    updateAdmin,
    deleteAdmin,
}
