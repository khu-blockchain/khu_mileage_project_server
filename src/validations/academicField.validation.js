const joi = require('joi');

const getAcademicFieldList = {
    query: joi.object().keys({
        category: joi.string().valid(
            "학술분야", "국제분야", "창업분야", "봉사분야", "기타활동"
        ),
    }),
    params: joi.object().keys({}),
    body: joi.object().keys({}),
}

module.exports = {
    getAcademicFieldList
}
