const Caver = require('caver-js');
const caver = new Caver('https://public-en-kairos.node.kaia.io')


async function addAdminKeyringAtCaverJs() {
    const addedSingle = caver.wallet.newKeyring(config.kaia.adminAddress, config.kaia.adminPrivateKey)
    return addedSingle
}