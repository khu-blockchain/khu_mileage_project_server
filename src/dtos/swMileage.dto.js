const constants = require("../config/constants")
class GetSwMileageListDTO {
    constructor({ studentId, status }) {
        this.student_id = studentId;
        this.status = status;
    }
}

class CreateSwMileageDTO {
    constructor({
        studentId,
        name,
        department,
        phoneNumber,
        email,
        walletAddress,
        content,
        academicField,
        extracurricularActivity,
        extracurricularActivityClassification,
        rawTransaction
    }) {
        this.student_id = studentId
        this.name = name
        this.department = department
        this.phone_number = phoneNumber
        this.email = email
        this.wallet_address = walletAddress
        this.content = content
        this.academic_field = academicField
        this.extracurricular_activity = extracurricularActivity
        this.extracurricular_activity_classification = extracurricularActivityClassification
        this.status = constants.SW_MILEAGE_STATUS.CREATE
        this.transaction_hash = rawTransaction
    }
}

class GetSwMileageByIdDTO {
    constructor({ }) {
        // this. = ;
    }
}

class SwMileageDTO {
    constructor({
        sw_mileage_id,
        student_id,
        name,
        department,
        phone_number,
        email,
        content,
        wallet_address,
        academic_field,
        extracurricular_activity,
        extracurricular_activity_classification,
        status,
        comment,
        sw_mileage_files
    }) {
        this.sw_mileage_id = sw_mileage_id
        this.student_id = student_id
        this.name = name
        this.department = department
        this.phone_number = phone_number
        this.email = email
        this.wallet_address = wallet_address
        this.content = content
        this.academic_field = academic_field
        this.extracurricular_activity = extracurricular_activity
        this.extracurricular_activity_classification = extracurricular_activity_classification
        this.status = status,
        this.comment = comment,
        this.sw_mileage_files = sw_mileage_files
    }
}
class SwMileageFileDTO {
    constructor({ sw_mileage_file_id, sw_mileage_id, url, name }) {
        this.sw_mileage_file_id = sw_mileage_file_id;
        this.sw_mileage_id = sw_mileage_id;
        this.url = url;
        this.name = name;
    }
}

class UpdateSwMileageDTO {
    constructor({}) { }
}

class UpdateSwMileageStatusDTO {
    constructor({ status, comment
    }) {
        this.status = status;
        this.comment = comment;
    }
}

class DeleteSwMileageDTO {
    constructor({ }) {
        // this. = ;
    }
}

class CreateSwMileageFileDTO {
    constructor({ sw_mileage_id, url, name }) {
        this.sw_mileage_id = sw_mileage_id
        this.url = url
        this.name = name
    }
}

class GetSwMileageFileListDTO {
    constructor({swMileageId, name, limit, offset }) {
        this.sw_mileage_id = swMileageId;
        this.name = name;
        this.limit = limit;
        this.offset = offset;
    }
}

module.exports = {
    SwMileageDTO,
    SwMileageFileDTO,
    GetSwMileageListDTO,
    GetSwMileageByIdDTO,
    CreateSwMileageDTO,
    UpdateSwMileageDTO,
    UpdateSwMileageStatusDTO,
    DeleteSwMileageDTO,

    CreateSwMileageFileDTO,
    GetSwMileageFileListDTO,
};
