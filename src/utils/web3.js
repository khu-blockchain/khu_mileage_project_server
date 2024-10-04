const web3 = require('web3');
// const web3 = new Web3();

const createAccount = () => {
    return web3.eth.accounts.create();
};

const getAccount = (privateKey) => {
    return web3.eth.accounts.privateKeyToAccount(privateKey);
};

const createContract = (abiCode) => {
    return new web3.eth.Contract(abiCode);
};

const getBalance = async (address) => {
    // return await web3.eth.getBalance(address)
};

const getGas = async () => {
    // return await web3.eth.getGasPrice()
};

const getNonce = async (address, status) => {
    // return await getTransactionCount(address, status)
};

const contract = async (abiCode) => {
    return web3.Contract();
};

const getTransactionCount = async (address, status) => {
    // if(status !== 'pending' && status !== 'latest' && status !== 'earliest') {
    //    throw new Error('invalid status')
    // }
    // return await web3.eth.getTransactionCount(address, status)
};

const fromWei = (value) => {
    return web3.utils.fromWei(value.toString());
};

const toWei = (value) => {
    return web3.utils.toWei(value.toString());
};

const isAddress = (address) => {
    return web3.utils.isAddress(address)
};

const decodeParameters = (dataTypes, value) => {
    return web3.eth.abi.decodeParameters(dataTypes, value);
}

const makeSignData = (chainId, nonce, to, data, gasPrice, gas = null) => {
    return {
        chainId,
        nonce: decimalToHex(nonce),
        to,
        data,
        value: null,
        gas: gas ? decimalToHex(Number(gas) * 10) : '0x3938700', //50,000,000
        gasPrice: decimalToHex(Number(gasPrice)),
    };
};

const getSignTransaction = async (chainId, nonce, to, data, gasPrice, privateKey, gas = null) => {
    return await web3.eth.accounts.signTransaction(
        {
            chainId,
            nonce: decimalToHex(nonce),
            to,
            data,
            value: null,
            gas: gas === null ? '0x1c9c380' : decimalToHex(Number(gas)), //30,000,000
            gasPrice: decimalToHex(Number(gasPrice)),
        },
        privateKey,
    );
};

const hexToDecimal = (number, returnType = 'number') => {
    try {
        switch (returnType) {
            case 'number':
                return web3.utils.hexToNumber(number);
            case 'string':
                return web3.utils.hexToNumberString(number);
        }
    } catch (e) {
        return number;
    }
};

const decimalToHex = (number) => {
    return web3.utils.fromDecimal(number);
};

module.exports = {
    createAccount,
    getAccount,
    createContract,
    makeSignData,
    getSignTransaction,
    hexToDecimal,
    decimalToHex,
    toWei,
    fromWei,
    isAddress,
    decodeParameters
};
