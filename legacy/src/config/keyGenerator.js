const { randomBytes } = require('crypto');

const replaceSlashRegExp = new RegExp('\\/', 'g');
const replacePlusRegExp = new RegExp('\\+', 'g');
const replaceEqualRegExp = new RegExp('\\=', 'g');
const replaceUnderbarRegExp = new RegExp('\\-', 'g');
const replaceMiddlebarRegExp = new RegExp('\\_', 'g');

const generateRandomAlphabetString = (bytes) => {
    return randomBytes(bytes)
        .toString('base64')
        .replace(replaceSlashRegExp, '-')
        .replace(replacePlusRegExp, '_')
        .replace(replaceEqualRegExp, '')
        .replace(replaceUnderbarRegExp, '')
        .replace(replaceMiddlebarRegExp, '');
};

module.exports = {
    generateRandomAlphabetString,
};