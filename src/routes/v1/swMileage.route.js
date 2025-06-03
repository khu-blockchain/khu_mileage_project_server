const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate');
const formDataParse = require('../../middlewares/formDataParse');
const constants = require('../../config/constants');

const { swMileageValidation } = require('../../validations');
const { swMileageController } = require('../../controllers');

const router = express.Router();

router
    .route('/files')
    .get(auth(constants.ROLE.STUDENT), validate(swMileageValidation.getSwMileageFileList), swMileageController.getSwMileageFileList)

router
    .route('/files/:swMileageFileId')
    .get(auth(constants.ROLE.STUDENT), validate(swMileageValidation.getSwMileageFileById), swMileageController.getSwMileageFileById)

router
    .route('/:swMileageId')
    .get(auth(constants.ROLE.STUDENT), validate(swMileageValidation.getSwMileageById), swMileageController.getSwMileageById)
    .put(auth(constants.ROLE.STUDENT), validate(swMileageValidation.updateSwMileage), swMileageController.updateSwMileage)
// .delete(auth(constants.ROLE.STUDENT), validate(swMileageValidation.deleteSwMileage), swMileageController.deleteSwMileage);

router
    .route('/:swMileageId/approve')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageValidation.approveSwMileage), swMileageController.approveSwMileage)

router
    .route('/:swMileageId/reject')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageValidation.rejectSwMileage), swMileageController.rejectSwMileage)

router
    .route('/:swMileageId/status')
    .patch(auth(constants.ROLE.ADMIN), validate(swMileageValidation.updateSwMileageStatus), swMileageController.updateSwMileageStatus)


router
    .route('/')
    .get(auth(constants.ROLE.STUDENT), validate(swMileageValidation.getSwMileageList), swMileageController.getSwMileageList)
    .post(auth(constants.ROLE.STUDENT), formDataParse(), validate(swMileageValidation.createSwMileage), swMileageController.createSwMileage);

module.exports = router;