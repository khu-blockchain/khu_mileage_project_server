const {
    sequelize,
    SwMileage,
    SwMileageFile,
} = require('../models')
const { CreateSwMileageFileDTO, SwMileageDTO, SwMileageFileDTO } = require('../dtos/swMileage.dto')
const ApiError = require('../utils/ApiError')
const httpStatus = require('http-status')
const { Op } = require('sequelize')

const getSwMileageList = async (getSwMileageListDTO) => {
    return await SwMileage.findAll({
        include: {
            model: SwMileageFile,
            as: 'sw_mileage_files',
        },
        where: {
            ...(getSwMileageListDTO.lastId !== null && getSwMileageListDTO.lastId !== undefined && { sw_mileage_id: { [Op.lt]: getSwMileageListDTO.lastId } }),
            ...(getSwMileageListDTO.status !== null && getSwMileageListDTO.status !== undefined && { status: getSwMileageListDTO.status }),
            ...(getSwMileageListDTO.student_id !== null && getSwMileageListDTO.student_id !== undefined && { student_id: getSwMileageListDTO.student_id }),
        },
        limit: getSwMileageListDTO.limit,
        // offset: getSwMileageListDTO.offset,
        order: [['sw_mileage_id', 'DESC'],['created_at', 'DESC']],
    })
}

const getSwMileageById = async (swMileageId) => {
    const swMileage = await SwMileage.findOne({
        include: {
            model: SwMileageFile,
            as: 'sw_mileage_files',
        },
        where: {
            sw_mileage_id: swMileageId,
        }
    })

    if (!swMileage) {
        return null
    }

    return new SwMileageDTO(swMileage)
}

const createSwMileage = async (createSwMileageDTO, transaction = null) => {
    const swMileage = await SwMileage.create(createSwMileageDTO, {
        transaction,
    },)

    return new SwMileageDTO(swMileage)
}
const createSwMileageFile = async (createSwMileageFileDTO, transaction) => {
    const swMileageFile = await SwMileageFile.create(createSwMileageFileDTO, {
        transaction,
    },)

    return new SwMileageFileDTO(swMileageFile)
}

const createSwMileageAndFiles = async (createSwMileageDTO, fileList = []) => {
    return await sequelize.transaction(async (transaction) => {
        const swMileage = await createSwMileage(createSwMileageDTO, transaction)
        const swMileageFiles = []

        for (const file of fileList) {
            const createSwMileageFileDTO = new CreateSwMileageFileDTO({ sw_mileage_id: swMileage.sw_mileage_id, url: file.url, name: file.name })
            const swMileageFile = await createSwMileageFile(createSwMileageFileDTO, transaction)
            swMileageFiles.push(swMileageFile)
        }

        return {
            swMileage,
            swMileageFiles
        }
    })
}

const updateSwMileage = async (swMileageId, updateSwMileageDTO) => {
    console.log("enter update swMileage service")
    await SwMileage.update(updateSwMileageDTO, {
        where: {
            sw_mileage_id: swMileageId,
        },
    })

    return new SwMileageDTO(await SwMileage.findOne({
        include: {
            model: SwMileageFile,
            as: 'sw_mileage_files',
        },
        where: {
            sw_mileage_id: swMileageId,
        }
    }))
}

const deleteSwMileage = async (swMileageId) => {
    const result = await SwMileage.destroy({
        where: {
            sw_mileage_id: swMileageId,
        }
    })

    if (!result) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "delete swMileage failed")
    }

    return result
}

const validateStudentInformation = async (studentDTO, createSwMileageDTO) => {
    if (studentDTO.student_id !== createSwMileageDTO.student_id) { return { result: false, message: 'student_id is not match student info' } }
    if (studentDTO.name !== createSwMileageDTO.name) { return { result: false, message: 'name is not match student info' } }
    if (studentDTO.department !== createSwMileageDTO.department) { return { result: false, message: 'department is not match student info' } }
    if (studentDTO.phone_number !== createSwMileageDTO.phone_number) { return { result: false, message: 'phone_number is not match student info' } }
    if (studentDTO.email !== createSwMileageDTO.email) { return { result: false, message: 'email is not match student info' } }
    return { result: true, message: "validated" }
}

const getSwMileageFileList = async (getSwMileageFileListDTO) => {
    return await SwMileageFile.findAll({
        where: {
            ...(getSwMileageFileListDTO.name !== null && getSwMileageFileListDTO.name !== undefined && { name: getSwMileageFileListDTO.name }),
            ...(getSwMileageFileListDTO.sw_mileage_id !== null && getSwMileageFileListDTO.sw_mileage_id !== undefined && { sw_mileage_id: getSwMileageFileListDTO.sw_mileage_id }),
        },
        limit: getSwMileageFileListDTO.limit,
        offset: getSwMileageFileListDTO.offset,
        order: [['created_at', 'DESC']],
    })
}

const getSwMileageFileById = async (swMileageFileId) => {
    const swMileageFile = await SwMileageFile.findOne({
        where: {
            sw_mileage_file_id: swMileageFileId,
        }
    })

    if (!swMileageFile) {
        return null
    }

    return new SwMileageFileDTO(swMileageFile)
}


module.exports = {
    getSwMileageList,
    getSwMileageById,
    createSwMileage,
    createSwMileageAndFiles,
    updateSwMileage,
    deleteSwMileage,
    validateStudentInformation,
    getSwMileageFileList,
    getSwMileageFileById,
}
