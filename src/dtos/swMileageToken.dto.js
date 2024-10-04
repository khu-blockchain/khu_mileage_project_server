const constants = require("../config/constants")

class GetSwMileageTokenListDTO {
    constructor({ }) {
    }
}

class CreateSwMileageTokenDTO {
    constructor({
        swMileageTokenName,
        contractAddress,
        contractOwnerAddress,
        swMileageTokenSymbol,
        swMileageTokenDecimals,
        swMileageTokenImageUrl,
        description,
        isPaused,
        isActivated,
    }) {
        this.sw_mileage_token_name = swMileageTokenName;
        this.contract_address = contractAddress;
        this.contract_owner_address = contractOwnerAddress;
        this.sw_mileage_token_symbol = swMileageTokenSymbol;
        this.sw_mileage_token_decimals = swMileageTokenDecimals;
        this.sw_mileage_token_image_url = swMileageTokenImageUrl;
        this.description = description;
        this.is_paused = isPaused;
        this.is_activated = isActivated;
    }
}

class GetSwMileageTokenByIdDTO {
    constructor({ }) {
        // this. = ;
    }
}

class SwMileageTokenDTO {
    constructor({
    }) {
    }
}

class UpdateSwMileageTokenDTO {
    constructor({
    }) {
    }
}

class DeleteSwMileageTokenDTO {
    constructor({ }) {
        // this. = ;
    }
}

module.exports = {
    SwMileageTokenDTO,
    GetSwMileageTokenListDTO,
    GetSwMileageTokenByIdDTO,
    CreateSwMileageTokenDTO,
    UpdateSwMileageTokenDTO,
    DeleteSwMileageTokenDTO,
};
