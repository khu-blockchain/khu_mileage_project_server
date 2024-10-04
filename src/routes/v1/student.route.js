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


module.exports = router;