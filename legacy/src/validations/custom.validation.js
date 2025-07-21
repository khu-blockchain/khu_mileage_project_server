const web3 = require('../utils/web3');
const bankCode = require('../utils/data/bankCode')
const bankCodeKeys = Object.keys(bankCode);

const phoneNumberRegularExpression = new RegExp(/^(01[016789])-(\d{3,4})-(\d{4})$/)
const emailRegularExpression = new RegExp(/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/)

const walletAddressValidation = (value, helpers) => {
    if (web3.isAddress(value)) {
        return value;
    } else {
        return helpers.message('Invalid Wallet Address')
    }
};

const bankCodeValidation = (value, helpers) => {
    if (bankCodeKeys.includes(value)) {
        return value;
    } else {
        return helpers.message('Invalid Bank Code')
    }
};


const phoneNumberValidation = (value, helpers) => {
    if (phoneNumberRegularExpression.test(value)) {
        return value;
    } else {
        return helpers.message('Invalid phone number format');
    }
};

const emailValidation = (value, helpers) => {
    if (emailRegularExpression.test(value)) {
        return value;
    } else {
        return helpers.message('Invalid email format');
    }
};

const rawTransactionValidation = (value, helpers) => {
    try {
        const dataTypes = ['uint256']
        const decodedRawTransaction = web3.decodeParameters(dataTypes, value);
        if (decodedRawTransaction) {
            return value;
        } else {
            return helpers.message('Invalid raw transaction format');
        }
    } catch (err) {
        return helpers.message('Invalid raw transaction format');
    }
};

module.exports = {
    walletAddressValidation,
    bankCodeValidation,
    phoneNumberValidation,
    emailValidation,
    rawTransactionValidation,
};
