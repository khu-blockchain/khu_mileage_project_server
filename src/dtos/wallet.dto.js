class GetWalletLostListDTO {
  constructor({ limit, lastId }) {
    this.limit = limit;
    this.last_id = lastId;
  }
}

class CreateWalletLostDTO {
  constructor({ studentId, walletAddress, targetAddress, name, student_hash }) {
    this.student_id = studentId;
    this.name = name;
    this.address = walletAddress;
    this.student_hash = student_hash;
    this.target_address = targetAddress;
  }
}

class GetWalletLostByStudentIdDTO {
  constructor({ studentId, limit, lastId }) {
    this.student_id = studentId;
    this.limit = limit;
    this.last_id = lastId;
  }
}

class WalletHistoryDto {
  constructor({
    wallet_history_id,
    student_id,
    address,
    target_address,
    name,
    student_hash,
    is_confirmed,
  }) {
    this.wallet_history_id = wallet_history_id;
    this.student_id = student_id;
    this.name = name;
    this.student_hash = student_hash;
    this.address = address;
    this.target_address = target_address;
    this.is_confirmed = is_confirmed;
  }
}

module.exports = {
  GetWalletLostListDTO,
  CreateWalletLostDTO,
  GetWalletLostByStudentIdDTO,
  WalletHistoryDto,
};
