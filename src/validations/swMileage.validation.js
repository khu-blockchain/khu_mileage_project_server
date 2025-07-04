const joi = require("joi");
const {
  walletAddressValidation,
  phoneNumberValidation,
  emailValidation,
  rawTransactionValidation,
} = require("./custom.validation");
const constants = require("../config/constants");
const { raw } = require("mysql2");

const getSwMileageList = {
  query: joi.object().keys({
    studentId: joi.string(),
    status: joi.number().min(0).max(2),
    offset: joi.number().default(0),
    limit: joi.number().default(100),
    lastId: joi.number(),
  }),
  params: joi.object().keys({}),
  body: joi.object().keys({}),
};

const createSwMileage = {
  query: joi.object().keys({}),
  params: joi.object().keys({}),
  body: joi.object().keys({}),
  requestData: joi.object().keys({
    studentId: joi.string().required(),
    name: joi.string().required(),
    department: joi.string().required(),
    phoneNumber: joi.string().custom(phoneNumberValidation), // todo 000-0000-0000 형식으로 재 개발
    email: joi.string().custom(emailValidation),
    walletAddress: joi.string().custom(walletAddressValidation),
    content: joi.string().required(),
    academicField: joi.string().required(),
    extracurricularActivity: joi.string().required(),
    extracurricularActivityClassification: joi.string(), // 없는 경우 null
    rawTransaction: joi.string().required(), // DocSubmitted rawTx
    docHash: joi.string().required(),
  }),
};

const getSwMileageById = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({}),
};

const updateSwMileage = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({}),
};
const deleteSwMileage = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({}),
};

const getSwMileageFileList = {
  query: joi.object().keys({
    swMileageId: joi.number(),
    limit: joi.number(),
    offset: joi.number(),
  }),
  params: joi.object().keys({}),
  body: joi.object().keys({}),
};

const getSwMileageFileById = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageFileId: joi.number().required(),
  }),
  body: joi.object().keys({}),
};

const updateSwMileageStatus = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({
    status: joi.number().valid(...Object.values(constants.SW_MILEAGE_STATUS)),
    comment: joi.string(),
  }),
};

const approveSwMileage = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({
    rawTransaction: joi.custom(rawTransactionValidation).required(),
  }),
};

const rejectSwMileage = {
  query: joi.object().keys({}),
  params: joi.object().keys({
    swMileageId: joi.number().required(),
  }),
  body: joi.object().keys({
    comment: joi.string(),
    rawTransaction: joi.custom(rawTransactionValidation).required(),
  }),
};

module.exports = {
  getSwMileageList,
  createSwMileage,
  getSwMileageById,
  updateSwMileage,
  updateSwMileageStatus,
  deleteSwMileage,
  approveSwMileage,
  rejectSwMileage,
  getSwMileageFileList,
  getSwMileageFileById,
};
