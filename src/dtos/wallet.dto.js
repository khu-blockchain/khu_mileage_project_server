class GetWalletLostListDTO {
    constructor({
        limit, lastId
    }) {
        this.limit = limit;
        this.last_id = lastId;
    }
}

class CreateWalletLostDTO {
    constructor({
        studentId, walletAddress, targetAddress
    }) {
        this.student_id = studentId;
        this.address = walletAddress;
        this.target_address = targetAddress;
    }
}

class GetWalletLostByStudentIdDTO {
    constructor({
        studentId, limit, lastId
    }) {
        this.student_id = studentId;
        this.limit = limit;
        this.last_id = lastId;
    }
}

class WalletHistoryDto {
    constructor({
        wallet_history_id, student_id, address, target_address, is_confirmed
    }) {
        this.wallet_history_id = wallet_history_id;
        this.student_id = student_id;
        this.address = address;
        this.target_address = target_address;
        this.is_confirmed = is_confirmed;
    }
}

module.exports = {
    GetWalletLostListDTO,
    CreateWalletLostDTO,
    GetWalletLostByStudentIdDTO, 
    WalletHistoryDto
};
