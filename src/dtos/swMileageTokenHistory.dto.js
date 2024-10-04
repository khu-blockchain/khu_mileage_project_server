const constants = require("../config/constants");

class GetSwMileageTokenHistoryListDTO {
    constructor({ 
        swMileageTokenId,
        transactionType,
        adminAddress,
        studentAddress,
        studentId,
        adminId,
        lastId,
        order,
        limit,
        offset,
     }) {
        this.sw_mileage_token_id = swMileageTokenId
        this.transaction_type = transactionType
        this.admin_address = adminAddress
        this.student_address = studentAddress
        this.student_id = studentId
        this.admin_id = adminId
        this.last_id = lastId
        this.order = order
        this.limit = limit
        this.offset = offset
    }
}

class CreateSwMileageTokenHistoryDTO {
    constructor({
        swMileageTokenId,
        amount,
        transactionType,
        studentAddress,
        studentId,
        adminAddress,
        adminId,
        comment,
    }) {
        this.amount = amount;
        this.transaction_type = transactionType;
        this.student_address = studentAddress;
        this.student_id = studentId;
        this.admin_address = adminAddress;
        this.admin_id = adminId;
        this.sw_mileage_token_id = swMileageTokenId;
        this.comment = comment;
        this.status = constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.CREATE
    }
}

class GetSwMileageTokenHistoryByIdDTO {
    constructor({ }) {
        // this. = ;
    }
}

class SwMileageTokenHistoryDTO {
    constructor({

    }) {

    }
}

class UpdateSwMileageTokenHistoryDTO {
    constructor({ status
    }) {
        this.status = status;
    }
}

class DeleteSwMileageTokenHistoryDTO {
    constructor({ }) {
        // this. = ;
    }
}

module.exports = {
    SwMileageTokenHistoryDTO,
    GetSwMileageTokenHistoryListDTO,
    GetSwMileageTokenHistoryByIdDTO,
    CreateSwMileageTokenHistoryDTO,
    UpdateSwMileageTokenHistoryDTO,
    DeleteSwMileageTokenHistoryDTO,
};
