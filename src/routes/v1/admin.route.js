const express = require('express');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/authenticate')
const constants = require('../../config/constants')
const {adminValidation} = require('../../validations');
const {adminController} = require('../../controllers');

const router = express.Router();

router
    .route('/')
    .get(auth(constants.ROLE.ADMIN), validate(adminValidation.getAdminList), adminController.getAdminList)
    .post(validate(adminValidation.createAdmin), adminController.createAdmin);

router
    .route('/:adminId')
    .get(auth(constants.ROLE.ADMIN), validate(adminValidation.getAdminById), adminController.getAdminById)
    .put(auth(constants.ROLE.ADMIN), validate(adminValidation.updateAdmin), adminController.updateAdmin)
    .delete(auth(constants.ROLE.ADMIN), validate(adminValidation.deleteAdmin), adminController.deleteAdmin);

module.exports = router;