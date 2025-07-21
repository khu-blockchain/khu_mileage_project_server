const academicField = require('../utils/data/academicField')
const constants = require('../config/constants')
const getAcademicFieldList = async (getAcademicFieldListDTO) => {
    switch (getAcademicFieldListDTO.category) {
        // 학술분야
        case constants.ACADEMIC_FIELD_CATEGORY.ACADEMIC_FIELD:
            return academicField.academicField
        // 국제분야
        case constants.ACADEMIC_FIELD_CATEGORY.INTERNATIONAL_FIELD:
            return academicField.internationalField
        // 창업분야
        case constants.ACADEMIC_FIELD_CATEGORY.ENTREPRENEURSHIP_FIELD:
            return academicField.entrepreneurshipField
        // 봉사분야
        case constants.ACADEMIC_FIELD_CATEGORY.SERVICE_FIELD:
            return academicField.serviceField
        // 기타활동
        case constants.ACADEMIC_FIELD_CATEGORY.OTHER_ACTIVITIES:
            return academicField.otherActivities
        default:
            return academicField
    }
}

module.exports = {
    getAcademicFieldList
}