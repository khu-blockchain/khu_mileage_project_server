class GetAdminListDTO {
  constructor({}) {
    // this. = ;
  }
}

class CreateAdminDTO {
  constructor({
    adminId,
    password,
    salt,
    name,
    role,
    walletAddress,
    email,
  }) {
    this.admin_id = adminId;
    this.password = password;
    this.salt = salt;
    this.name = name;
    this.role = role;
    this.wallet_address = walletAddress;
    this.email = email;
  }
}
class GetAdminByIdDTO {
  constructor({}) {
    // this. = ;
  }
}

// delete password, salt
class AdminDTO {
  constructor({
    admin_id,
    name,
    wallet_address,
    email,
    role,
  }) {
    this.admin_id = admin_id;
    this.name = name;
    this.wallet_address = wallet_address;
    this.email = email;
    this.role = role;
  }
}

class UpdateAdminDTO {
  constructor({ adminId, password, name, walletAddress, email }) {
    this.admin_id = adminId;
    this.password = password;
    this.name = name;
    this.wallet_address = walletAddress;
    this.email = email;
  }
}

class DeleteAdminDTO {
  constructor({}) {
    // this. = ;
  }
}
module.exports = {
  GetAdminListDTO,
  GetAdminByIdDTO,
  AdminDTO,
  CreateAdminDTO,
  UpdateAdminDTO,
  DeleteAdminDTO,
};
