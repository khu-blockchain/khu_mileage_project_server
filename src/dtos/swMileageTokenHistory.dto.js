const constants = require("../config/constants");

class GetSwMileageTokenHistoryListDTO {
    constructor({ 
        swMileageTokenId,
        type,
        adminAddress,
        studentAddress,
        studentId,
        lastId,
        order,
        limit,
        offset,
     }) {
        this.sw_mileage_token_id = swMileageTokenId
        this.type = type
        this.admin_address = adminAddress
        this.student_address = studentAddress
        this.student_id = studentId
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
        swMileageId,
        transactionType,
        studentAddress,
        studentId,
        adminAddress,
        adminId,
        comment,
        transactionHash
    }) {
        this.amount = amount;
        this.transaction_type = transactionType;
        this.student_address = studentAddress;
        this.student_id = studentId;
        this.sw_mileage_id = swMileageId;
        this.admin_address = adminAddress;
        this.admin_id = adminId;
        this.sw_mileage_token_id = swMileageTokenId;
        this.comment = comment;
        this.status = constants.SW_MILEAGE_TOKEN_HISTORY.STATUS.CREATE
        this.transaction_hash = transactionHash;
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
