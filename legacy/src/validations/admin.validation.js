const joi = require('joi');
const { walletAddressValidation, phoneNumberValidation, emailValidation } = require('./custom.validation')

const getAdminList= {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({}),
}

const createAdmin = {
    query: joi.object().keys({}),
    params: joi.object().keys({}),
    body: joi.object().keys({
        adminId: joi.string().required(),
        password: joi.string().required(),
        passwordConfirm: joi.string().required(),
        email: joi.string().custom(emailValidation),
        // phoneNumber: joi.string().custom(phoneNumberValidation),
        name: joi.string().required(),
        walletAddress: joi.string().custom(walletAddressValidation),
        // department: joi.string().required(),
        // rawTransaction: joi.string().required(),
    }),
}

const getAdminById = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        adminId: joi.string().required(),
    }),
    body: joi.object().keys({}),
}

const updateAdmin = {
    query: joi.object().keys({}),
    params: joi.object().keys({
      adminId: joi.string().required(),
    }),
    body: joi.object().keys({
      email: joi.string().custom(emailValidation),
      //phone_number: joi.string(),
      name: joi.string(),
      walletAddress: joi.string().custom(walletAddressValidation),
      //department: joi.string(),
    }),
  };

const deleteAdmin = {
    query: joi.object().keys({}),
    params: joi.object().keys({
        adminId: joi.string().required(),
    }),
    body: joi.object().keys({})
}

module.exports = {
    getAdminList,
    createAdmin,
    getAdminById,
    updateAdmin,
    deleteAdmin
}
