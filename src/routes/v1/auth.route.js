const express = require('express');
const validate = require('../../middlewares/validate');
const {authValidation} = require('../../validations');
const {authController} = require('../../controllers');

const router = express.Router();

// 학생, 어드민 로그인에 대한 구별은 query의 loginType 진행
router
    .route('/login')
    .post(validate(authValidation.login), authController.studentLogin);
router
    .route('/admin/login')
    .post(validate(authValidation.login), authController.adminLogin);

router
    .route('/refresh-token')
    .post(validate(authValidation.refreshToken), authController.refreshToken);

module.exports = router;