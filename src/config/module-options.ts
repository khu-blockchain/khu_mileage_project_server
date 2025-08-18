import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';
import * as Joi from 'joi';

import configuration from './configuration';

export const configModuleOptions: ConfigModuleOptions = {
  envFilePath: '.env',
  load: [configuration],
  validationSchema: Joi.object({
    APP_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    APP_PORT: Joi.number().required(),
    CORS_ORIGIN: Joi.string().required(),
    PUBLIC_FILE_URL: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_NAME: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASS: Joi.string().required(),
    JWT_PUBLIC_KEY_BASE64: Joi.string().required(),
    JWT_PRIVATE_KEY_BASE64: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXP_IN_SEC: Joi.number().required(),
    JWT_REFRESH_TOKEN_EXP_IN_SEC: Joi.number().required(),
    FEE_PAYER_PRIVATE_KEY: Joi.string().required(),
    FEE_PAYER_ADDRESS: Joi.string().required(),
    KAIROS_CHAIN_ID: Joi.number().required(),
    KAIROS_RPC_URL: Joi.string().required(),
    STUDENT_MANAGER_CONTRACT_ADDRESS: Joi.string().required(),
  }),
};
