const crypto = require('crypto');
const storage = require('./storage');
const time = require('./time');
const constants = require('./constants');

const uploadFile = async (files) => {
    const uploadedFiles = [];
    for (const file of files) {

        const info = file.info

        const path = createStoragePath(
            constants.SERVICE_NAME,
            null,
            encodeURIComponent(file.name),
            decodeURIComponent(info.filename),
            false,
        );

        const uploadResult = await storage.sendFile(file.data, path, file.info.mimeType);
        uploadedFiles.push({
            name: file.name,
            info: file.info,
            url: uploadResult.Location
        })
    }
    return uploadedFiles
}


const createStoragePath = (serviceName, version, fieldName, fileName, isRandom = true) => {
    const checkedFileName = checkFileName(fileName);

    const path = `${serviceName}/`;
    const versionPath = version ? `${version}/` : '';
    const fieldNamePath = `${fieldName}/`;
    const fileNamePath = isRandom
        ? createRandomName(getFileExtension(checkedFileName))
        : checkedFileName;
    return path + versionPath + fileNamePath;
};

const checkFileName = (fileName) => {
    fileName = fileName.replace(/ /g, '_');

    const regExp = /[\{\}\[\]\/?,;:|\)*~`!^\-+<>@\#$%&\\\=\(\'\"]/gi;
    if (regExp.test(fileName)) {
        fileName = fileName.replace(regExp, '');
    }

    return insertAt(fileName);

    function insertAt(str) {
        const extensionIndex = str.lastIndexOf('.');
        return `${str.slice(0, extensionIndex)}_${time.getTime()}${str.slice(extensionIndex)}`;
    }
};

const getFileExtension = (filename) => {
    return `.${filename.split('.').slice(-1)[0]}`;
};

const createRandomName = (extension) => {
    return crypto.randomBytes(20).toString('hex') + new Date().getTime().toString() + extension;
};

module.exports = {
    uploadFile,
};
