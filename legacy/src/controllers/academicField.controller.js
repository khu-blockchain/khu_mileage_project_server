const catchAsync = require('../utils/catchAsync');
const { academicFieldService } = require("../services");
const { GetAcademicFieldListDTO } = require('../dtos/academicField.dto');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const getAcademicFieldList = catchAsync(async (req, res) => {
    const getAcademicFieldListDTO = new GetAcademicFieldListDTO({ ...req.query, ...req.params, ...req.body });
    const result = await academicFieldService.getAcademicFieldList(getAcademicFieldListDTO);

    res.send(result);
})

module.exports = {
    getAcademicFieldList,
}