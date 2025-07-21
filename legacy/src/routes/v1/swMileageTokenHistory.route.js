const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate');
const formDataParse = require('../../middlewares/formDataParse');
const constants = require('../../config/constants');

const { swMileageTokenHistoryValidation } = require('../../validations');
const { swMileageTokenHistoryController } = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(validate(swMileageTokenHistoryValidation.getSwMileageTokenHistoryList), swMileageTokenHistoryController.getSwMileageTokenHistoryList)

router
    .route('/transaction-hash/:transactionHash')
    .get(validate(swMileageTokenHistoryValidation.getSwMileageTokenHistoryByTransactionHash), swMileageTokenHistoryController.getSwMileageTokenHistoryByTransactionHash)

router
    .route('/:swMileageTokenHistoryId')
    .get(validate(swMileageTokenHistoryValidation.getSwMileageTokenHistoryById), swMileageTokenHistoryController.getSwMileageTokenHistoryById)


module.exports = router;



