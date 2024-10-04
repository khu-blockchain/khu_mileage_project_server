class GetAdminListDTO {
    constructor({ }) {
        // this. = ;
    }
}

class CreateAdminDTO {
    constructor({
        id,
        password,
        salt,
        name,
        walletAddress,
        role,    
    }) {
        this.id = id;
        this.password = password;
        this.name = name;
        this.salt = salt;
        this.wallet_address = walletAddress;
        this.role = role;
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
        id,
        name,
        wallet_address,
        role,
    }) {
        this.admin_id = admin_id;
        this.id = id;
        this.name = name;
        this.wallet_address = wallet_address;
        this.role = role;
    }
}

class UpdateAdminDTO {
    constructor({
        id,
        password,
        salt,
        name,
        walletAddress,
        role,    
    }) {
        this.id = id;
        this.password = password;
        this.salt = salt;
        this.name = name;
        this.walletAddress = walletAddress;
        this.role = role;
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
