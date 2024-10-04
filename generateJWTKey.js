const crypto = require('crypto');

// RSA 키 쌍 생성
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem'
  }
});

console.log('Public Key:', publicKey);
console.log('Private Key:', privateKey);
