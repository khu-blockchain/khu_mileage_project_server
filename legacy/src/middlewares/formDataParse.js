const BusBoy = require('busboy');
const logger = require('../config/logger');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const busboyParse = async (req, isRandom) => {
    const busboy = BusBoy({ headers: req.headers, defParamCharset: 'utf8' });
    req.pipe(busboy);

    let fileCount = 0;
    let files = [];
    let requestData = {};

    return new Promise((resolve, reject) => {
        busboy.on('file', (name, file, info) => {
            let fileBuffer = Buffer.alloc(0);
            file.on('data', (data) => {
                fileBuffer = Buffer.concat([fileBuffer, data]);
            });
            file.on('end', () => {
                files.push({
                    name,
                    data: fileBuffer,
                    info
                });
                fileCount++;
            });
            file.on('error', (err) => {
                logger.error(`${new Date()} formDataParse :: file :: ${err}`);
                reject(err);
            });
        });

        busboy.on('field', (fieldName, value) => {
            try {
                requestData = Object.assign(requestData, { [fieldName]: value });
            } catch (err) {
                logger.error(`${new Date()} formDataParse :: field :: ${err}`);
                reject(err);
            }
        });

        busboy.on('finish', () => {
            req.fileCount = fileCount;
            req.files = files;
            req.requestData = requestData;
            resolve();
        });

        busboy.on('error', (err) => {
            reject(new Error('busboy error'));
        });
    });
};


const formDataParse = () => async (req, res, next) => {
    try {
        await busboyParse(req)
    } catch (error) {
        return next(new ApiError(httpStatus.BAD_REQUEST, error?.message ?? "invalid form-data"));
    }

    return next();
};

module.exports = formDataParse;
