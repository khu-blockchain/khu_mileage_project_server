const md5 = require('md5');
const { generateRandomAlphabetString } = require('../config/keyGenerator');

const hashPassword = (password) => {
    return md5(password);
};

const getSaltPassword = (salt, password) => {
    return md5(`khu${salt}${password}${salt}mileage`);
};

const generateSalt = () => {
    return generateRandomAlphabetString(6);
};

module.exports = {
    hashPassword,
    getSaltPassword,
    generateSalt,
}