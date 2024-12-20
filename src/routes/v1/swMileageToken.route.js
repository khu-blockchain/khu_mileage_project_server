const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate');
const formDataParse = require('../../middlewares/formDataParse');
const constants = require('../../config/constants');

const {swMileageTokenValidation} = require('../../validations');
const {swMileageTokenController} = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(validate(swMileageTokenValidation.getSwMileageTokenList), swMileageTokenController.getSwMileageTokenList)
    // create 함과 동시에 deploy
    .post(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.createSwMileageToken), swMileageTokenController.createSwMileageToken);


router
    .route('/activate')
    .get(validate(swMileageTokenValidation.getActivateSwmileagetoken), swMileageTokenController.getActivateSwmileagetoken)

router
    .route('/contract-code')
    .get(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.getSwMileageTokenABIandByteCode), swMileageTokenController.getSwMileageTokenABIandByteCode)

router
    .route('/:swMileageTokenId')
    .get(validate(swMileageTokenValidation.getSwMileageTokenById), swMileageTokenController.getSwMileageTokenById)
    // .put(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.updateSwMileageToken), swMileageTokenController.updateSwMileageToken)
    // .delete(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.deleteSwMileageToken), swMileageTokenController.deleteSwMileageToken);

router
    .route('/:swMileageTokenId/add-admin')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.addSwmileageTokenFeePayer), swMileageTokenController.addSwmileageTokenFeePayer);

// 마일리지 토큰 활성화, 활성화 되는 토큰은 1개만
router
    .route('/:swMileageTokenId/activate')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.activateSwMileageToken), swMileageTokenController.activateSwMileageToken);

// router
    // .route('/:swMileageId/deactivate')


// 마일리지 지급
router
    .route('/:swMileageTokenId/mint')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.mintSwMileageToken), swMileageTokenController.mintSwMileageToken);

// 마일리지 회수 POST
router
    .route('/:swMileageTokenId/burn-from')
    .post(auth(constants.ROLE.ADMIN), validate(swMileageTokenValidation.burnFromSwMileageToken), swMileageTokenController.burnFromSwMileageToken);

// 마일리지 회수 등록 POST, rawTransaction을 받고 서버에서 sign하고 처리
router
    .route('/:swMileageTokenId/approve')
    .post(auth(constants.ROLE.STUDENT), validate(swMileageTokenValidation.approveSwMileageToken), swMileageTokenController.approveSwMileageToken);

// 마일리지 회수 등록 확인 rawTransaction 생성을 위한 data
router
    .route('/approve/data')
    .get(auth(constants.ROLE.STUDENT), validate(swMileageTokenValidation.getApproveSwMileageTokenData), swMileageTokenController.getApproveSwMileageTokenData);

// 마일리지 순위 확인을 위한 API
router
    .route('/:swMileageTokenId/ranking')
    .get(validate(swMileageTokenValidation.getStudentsRankingRange), swMileageTokenController.getStudentsRankingRange);

module.exports = router;




