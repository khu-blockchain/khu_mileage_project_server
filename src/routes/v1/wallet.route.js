const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate')
const constants = require('../../config/constants')

const {walletValidation} = require('../../validations');
const {walletController} = require('../../controllers');

const router = express.Router();

router
    .route('/:walletHistoryId/approve')
    .post(auth(constants.ROLE.ADMIN),validate(walletValidation.approveWalletLost), walletController.approveWalletLost)

router
    .route('/:studentId')
    .get(auth(constants.ROLE.STUDENT), validate(walletValidation.getWalletLostByStudentId), walletController.getWalletLostByStudentId);

router
    .route('/')
    .get(auth(constants.ROLE.ADMIN), validate(walletValidation.getWalletLostList), walletController.getWalletLostList)
    .post(auth(constants.ROLE.STUDENT),validate(walletValidation.createWalletLost), walletController.createWalletLost)

router
    .route('/:studentId/check')
    .get(auth(constants.ROLE.STUDENT), validate(walletValidation.checkHasNotConfirmedWalletLost), walletController.checkHasNotConfirmedWalletLost)


module.exports = router;