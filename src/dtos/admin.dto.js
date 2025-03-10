class GetAdminListDTO {
    constructor({ }) {
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
        phoneNumber,
    }) {
        this.admin_id = adminId;
        this.password = password;
        this.name = name;
        this.salt = salt;
        this.role = role;
        this.wallet_address = walletAddress;
        this.email = email;
        this.phone_number = phoneNumber;
    }
}
class GetAdminByIdDTO {
    constructor({ }) {
        // this. = ;
    }
}

// delete password, salt
class AdminDTO {
    constructor({
        admin_id,
        name,
        wallet_address,
        phone_number,
        email,
        role,
    }) {
        this.admin_id = admin_id;
        this.name = name;
        this.wallet_address = wallet_address;
        this.email = email;
        this.phone_number = phone_number;
        this.role = role;
    }
}

class UpdateAdminDTO {
    constructor({
        id,
        password,
        name,
        walletAddress,
        email,
        phoneNumber,
    }) {
        this.id = id;
        this.password = password;
        this.name = name;
        this.walletAddress = walletAddress;
        this.email = email;
        this.phone_number = phoneNumber;
    }
}

class DeleteAdminDTO {
    constructor({ }) {
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
