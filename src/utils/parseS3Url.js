const config = require('../config/config');

const getS3PathByS3Url = (s3Url) => {
    const path = new URL(s3Url).pathname;
    const s3Name = config.s3.name;
    const s3Path = path.substring(path.indexOf(s3Name) + s3Name.length + 1);
    return s3Path;
};

module.exports = {
    getS3PathByS3Url,
};
