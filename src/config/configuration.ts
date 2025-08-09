export default (): any => ({
  app: {
    env: process.env.APP_ENV,
    type: process.env.APP_TYPE || 'main',
    port: process.env.APP_PORT,
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
    },
    publicFileUrl: process.env.PUBLIC_FILE_URL,
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
  },
  jwt: {
    publicKey: process.env.JWT_PUBLIC_KEY_BASE64!,
    privateKey: process.env.JWT_PRIVATE_KEY_BASE64!,
    accessTokenExpiresInSec: parseInt(process.env.JWT_ACCESS_TOKEN_EXP_IN_SEC!, 10),
    refreshTokenExpiresInSec: parseInt(process.env.JWT_REFRESH_TOKEN_EXP_IN_SEC!, 10),
  },
  feePayer: {
    privateKey: process.env.FEE_PAYER_PRIVATE_KEY,
    address: process.env.FEE_PAYER_ADDRESS,
  },
  kairos: {
    chainId: parseInt(process.env.KAIROS_CHAIN_ID!, 10),
    rpcUrl: process.env.KAIROS_RPC_URL,
  },
  contract: {
    studentManager: process.env.STUDENT_MANAGER_CONTRACT_ADDRESS,
    mileageTokenFactory: process.env.SW_MILEAGE_TOKEN_FACTORY_CONTRACT_ADDRESS,
  },
});
