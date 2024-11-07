const dotenv = require('dotenv');
const path = require('path');
const joi = require('joi');

dotenv.config({path: path.join(__dirname, '../../.env')});

const envVarSchema = joi.object()
    .keys({
        NODE_ENV: joi.string().valid('production', 'development', 'test').required(),
        PORT: joi.number().default(1987),
        
        // sql 관련
        SQL_HOST: joi.string().required(),
        SQL_PORT: joi.number().required(),
        SQL_DATABASE: joi.string().required(),
        SQL_USERNAME: joi.string().required(),
        SQL_PASSWORD: joi.string().required(),
        SQL_DIALECT: joi.string().required().valid('mysql', 'postgres', 'mssql'),

        // klaytn api service
        KLAYTN_CHIAN_ID: joi.number().required(),
        ADMIN_PRIVATE_KEY: joi.string().required(),
        ADMIN_ADDRESS: joi.string().required(),
        KLAYTN_NETWORK_URL: joi.string().required(),

        // // aws s3 key
        // AWS_S3_ACCESS_KEY_ID: joi.string().required(),
        // AWS_S3_SECRET_ACCESS_KEY: joi.string().required(),
        // AWS_S3_BUCKET_NAME: joi.string().required(),
        // AWS_S3_REGION: joi.string().required(),

        // jwt key
        JWT_PUBLIC_KEY: joi.string().required(),
        JWT_PRIVATE_KEY: joi.string().required(),

        ROOT_ADMIN_ID: joi.string().required(),
        ROOT_ADMIN_DEFAULT_SALT: joi.string().required(),
        ROOT_ADMIN_DEFAULT_NAME: joi.string().required(),
        ROOT_ADMIN_DEFAULT_PASSWORD: joi.string().required(),
    })
    .unknown();

const {value: envVars, error} = envVarSchema.prefs({errors: {label: 'key'}}).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    
    // sql 관련
    sequelize: {
        database: envVars.SQL_DATABASE,
        username: envVars.SQL_USERNAME,
        password: envVars.SQL_PASSWORD,
        host: envVars.SQL_HOST,
        port: envVars.SQL_PORT,
        dialect: envVars.SQL_DIALECT,
    },

    // klaytn
    klaytn: {
        kasAccessKeyId: envVars.KAS_ACCESS_KEY_ID,
        kasSecretAccessKey: envVars.KAS_SECRET_ACCESS_KEY,
        klaytnChainId: envVars.KLAYTN_CHIAN_ID,
        adminPrivateKey: envVars.ADMIN_PRIVATE_KEY,
        adminAddress: envVars.ADMIN_ADDRESS,
        adminWalletKey: envVars.ADMIN_PRIVATE_KEY + "0x00" + envVars.ADMIN_ADDRESS,
        klaytnNetworkUrl : envVars.KLAYTN_NETWORK_URL
    },

    // s3
    s3: {
        accessKeyId: envVars.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_S3_SECRET_ACCESS_KEY,
        name : envVars.AWS_S3_BUCKET_NAME,
        region : envVars.AWS_S3_REGION,
    },

    // jwt
    jwt: {
        publicKey: envVars.JWT_PUBLIC_KEY,
        privateKey: envVars.JWT_PRIVATE_KEY,
        accessTokenExpirationMinutes: envVars.ACCESS_TOKEN_EXPIRATION_MINUTES,
        refreshTokenExpirationHours: envVars.REFRESH_TOKEN_EXPIRATION_HOURS,
    },

    // rootAdmin,
    rootAdmin: {
        id : envVars.ROOT_ADMIN_ID,
        salt: envVars.ROOT_ADMIN_DEFAULT_SALT,
        name: envVars.ROOT_ADMIN_DEFAULT_NAME,
        password: envVars.ROOT_ADMIN_DEFAULT_PASSWORD,
    },
};
