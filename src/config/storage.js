const AWS = require('aws-sdk');
const config = require('./config');
const { getS3PathByS3Url } = require('../utils/parseS3Url');

const s3Setting = (({ name, ...obj }) => obj)(config.s3);

const s3 = new AWS.S3(s3Setting);

const sendFile = (fileStream, path, mimeType) => {
    const param = makeS3Parameter(fileStream, path, mimeType);
    return new Promise((resolve, reject) => {
        // S3 ManagedUpload with callbacks are not supported in AWS SDK for JavaScript (v3).
        // Please convert to `await client.upload(params, options).promise()`, and re-run aws-sdk-js-codemod.
        s3.upload(param, {}, function (err, data) {
            if (err) {
                reject(err);
            }
        })
            .on('httpUploadProgress', function (evt) {})
            .send(function (err, data) {
                if (err) {
                    reject(err);
                }
                makePublicRead(config.s3.name, path)
                resolve(data);
            });
    });
};

const deleteFile = (path) => {
    const param = {
        Bucket: config.s3.name,
        Key: path,
    };
    return new Promise((resolve, reject) => {
        s3.deleteObject(param, function (err, data) {
            if (err) {
                reject(err);
            }
        })
            // .on("httpUploadProgress", function (evt) {})
            .send(function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
    });
};

const deleteFileByUrl = (url) => {
    const path = getS3PathByS3Url(url);
    const param = {
        Bucket: config.s3.name,
        Key: path,
    };
    return new Promise((resolve, reject) => {
        s3.deleteObject(param, function (err, data) {
            if (err) {
                reject(err);
            }
        })
            // .on("httpUploadProgress", function (evt) {})
            .send(function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
    });
};

const multiUpload = async (paramArray) => {
    const uploadResultArray = [];
    for (let i = 0; i < paramArray.length; i++) {
        const uploadResult = await upload(paramArray[i]);
        uploadResultArray.push(uploadResult);
    }
    return uploadResultArray;
};

const upload = (param) => {
    return new Promise((resolve, reject) => {
        // S3 ManagedUpload with callbacks are not supported in AWS SDK for JavaScript (v3).
        // Please convert to `await client.upload(params, options).promise()`, and re-run aws-sdk-js-codemod.
        s3.upload(param, {}, function (err, data) {
            if (err) {
                reject(err);
            }
        })
            .on('httpUploadProgress', function (evt) {})
            .send(function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
    });
};

const makeS3Parameter = (stream, path, mimeType) => {
    return {
        Bucket: config.s3.name,
        Body: stream,
        Key: path,
        ContentType: mimeType,
    };
};

const makePublicRead = (bucket, key) => {
    const params = {
      Bucket: bucket,
      Key: key,
      ACL: 'public-read'
    };
  
    return new Promise((resolve, reject) => {
      s3.putObjectAcl(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  };

module.exports = {
    sendFile,
    deleteFile,
    deleteFileByUrl,
    multiUpload,
    makePublicRead,
};
