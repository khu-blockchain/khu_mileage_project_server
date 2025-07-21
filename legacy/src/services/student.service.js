const { Op } = require('sequelize')
const {
    sequelize,
    Student,
} = require('../models')
const { StudentDTO } = require('../dtos/student.dto')
const ApiError = require('../utils/ApiError')
const httpStatus = require('http-status')


const getStudentList = async (getStudentListDTO) => {
    return await Student.findAll({
        attributes: {
            exclude: ['password', 'salt'],
        },
        limit: getStudentListDTO.limit,
        //offset: getStudentListDTO.offset,
        where: {
            ...(getStudentListDTO.lastId !== null && getStudentListDTO.lastId !== undefined && { student_id: { [Op.gt]: getStudentListDTO.lastId } }),
        },
        order: [['student_id', 'ASC'],['created_at', 'DESC']],
    })
}

const getStudentById = async (studentId) => {
    const student = await Student.findOne({
        where: {
            student_id: studentId,
        }
    })

    if (!student) {
        return null
    }

    return new StudentDTO(student)
}

const getStudentPasswordAndSaltById = async (studentId) => {
    const student = await Student.findOne({
        where: {
            student_id: studentId,
        }
    })

    if (!student) {
        return null
    }

    return {
        salt: student.salt,
        password: student.password
    }
}

const getStudentByWalletAddress = async (walletAddress) => {
    const student = await Student.findOne({
        where: {
            wallet_address: walletAddress,
        }
    })

    if (!student) {
        return null
    }

    return new StudentDTO(student)
}

const getStudentListByWalletAddressList = async (walletAddressList) => {
    const studentList = await Student.findAll({
        where : {
            wallet_address : {
                [Op.in] : walletAddressList
            }
        }
    })

    return studentList.map(studentData => new StudentDTO(studentData))
    
}

const createStudent = async (createStudentDTO) => {
    const student = await Student.create(createStudentDTO)

    return new StudentDTO(student)
}

const updateStudent = async (studentId, updateStudentDTO) => {
    await Student.update(updateStudentDTO, {
        where: {
            student_id: studentId,
        },
    })
    return new StudentDTO(await Student.findOne({
        where: {
            student_id: studentId,
        }
    }))
}

const deleteStudent = async (studentId) => {
    const result = await Student.destroy({
        where: {
            student_id: studentId,
        }
    })

    if (!result) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "delete student failed")
    }

    return result
}

module.exports = {
    getStudentList,
    getStudentById,
    getStudentByWalletAddress,
    getStudentPasswordAndSaltById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentListByWalletAddressList,
}
