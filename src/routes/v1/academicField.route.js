const express = require('express');
const validate = require('../../middlewares/validate');
const { academicFieldValidation } = require('../../validations');
const { academicFieldController } = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(validate(academicFieldValidation.getAcademicFieldList), academicFieldController.getAcademicFieldList)

module.exports = router;
