const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate')
const constants = require('../../config/constants')
const {studentValidation} = require('../../validations');
const {studentController} = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(auth(constants.ROLE.ADMIN), validate(studentValidation.getStudentList), studentController.getStudentList)
    .post(validate(studentValidation.createStudent), studentController.createStudent);

router
    .route('/:studentId')
    .get(auth(constants.ROLE.STUDENT), validate(studentValidation.getStudentById), studentController.getStudentById)
    .put(auth(constants.ROLE.STUDENT), validate(studentValidation.updateStudent), studentController.updateStudent)
    .delete(auth(constants.ROLE.STUDENT), validate(studentValidation.deleteStudent), studentController.deleteStudent);


router
    .route('/:studentId/mint')
    .post(auth(constants.ROLE.ADMIN), validate(studentValidation.mintSwMileage), studentController.mintSwMileage)

router
    .route('/:studentId/burn')
    .post(auth(constants.ROLE.ADMIN), validate(studentValidation.burnSwMileage), studentController.burnSwMileage)


router
    .route('/:studentId/wallet-change')
    .post(auth(constants.ROLE.STUDENT), validate(studentValidation.requestWalletChange), studentController.requestWalletChange)

router
    .route('/:studentId/confirm-change')
    .post(auth(constants.ROLE.STUDENT), validate(studentValidation.confirmWalletChange), studentController.confirmWalletChange)


module.exports = router;