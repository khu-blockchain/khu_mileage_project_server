const Caver = require('caver-js');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const constants = require('../config/constants');
const SWMileageABI = require("../utils/data/contract/SwMileageABI.json");
const SWMileageByte = require("../utils/data/contract/SwMileageByte");

const caver = new Caver(config.kaia.klaytnNetworkUrl)

const keyringCreateFromPrivateKey = async () => {
    const keyringFromPrivateKey = caver.wallet.keyring.createFromPrivateKey(config.kaia.adminPrivateKey)

    return keyringFromPrivateKey
}

const createKeyRing = async(privateKey) => {
    const privateKeyInstance = caver.wallet.keyring.createFromPrivateKey(privateKey)

    return privateKeyInstance
}

// caver에 keyring 추가
async function addAdminKeyringAtCaverJs() {
    const addedSingle = caver.wallet.newKeyring(config.kaia.adminAddress, config.kaia.adminPrivateKey)
    return addedSingle
}

const addAdminKeyring = async (adminKeyring) => {

    caver.wallet.add(adminKeyring)
}

const deployKIP7Token = async (deployKIP7TokenDTO) => {
    try {
        const kip7Token = await caver.kct.kip7.deploy({
            name: deployKIP7TokenDTO.name,
            symbol: deployKIP7TokenDTO.symbol,
            decimals: deployKIP7TokenDTO.decimals,
            initialSupply: deployKIP7TokenDTO.initialSupply,
        }, {
            from: deployKIP7TokenDTO.deployAddress,
            feeDelegation: true,
            feePayer: config.kaia.adminAddress,
        })
        return kip7Token
    } catch (error) {
        throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
    }
}

// transfer 기능이 막힌 KIP7 contract 를 deploy 하는 함수입니다. 
const deployCustomKIP7Token = async (deployKIP7TokenDTO) => {
    try {
        const swMileageTokenContract = new caver.contract.create(SWMileageABI);
  
        const swMileageToken =  await swMileageTokenContract.deploy({
            from: deployKIP7TokenDTO.deployAddress,
            gas: constants.DEPLOY_KIP7_GAS,
            feeDelegation: true,
            feePayer: config.kaia.adminAddress,
        },`0x${SWMileageByte}`,
          deployKIP7TokenDTO.name,
          deployKIP7TokenDTO.symbol
        )
        return swMileageToken
    } catch (error) {
        console.log(error)
        throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
    }
}

// rlpEncoding 값을 받아서 feepayer의 서명을 통해 배퐇는 함수 입니다.
const deployCustomKIP7TokenAsFeePayer = async (rlpEncodingString) => {
    
    try {
        const deployTransaction = caver.transaction.decode(rlpEncodingString);
        
        const signedTransaction = await caver.wallet.signAsFeePayer(config.kaia.adminAddress, deployTransaction)

        // 최종 트랜잭션 전송
        const finalRawTransaction = signedTransaction.getRawTransaction()
        const receipt = await caver.rpc.klay.sendRawTransaction(finalRawTransaction)
        console.log(`The address of deployed smart contract: ${receipt.contractAddress}`)
        return receipt.contractAddress
    } catch (error) {
        console.log(error)
        throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
    }
}


const mintKIP7Token = async (mintKIP7TokenDTO) => {
    const kip7 = await caver.kct.kip7.create(mintKIP7TokenDTO.contractAddress)

    return await kip7.mint(mintKIP7TokenDTO.spenderAddress, caver.utils.toPeb(mintKIP7TokenDTO.amount, 'KLAY'), {
        from: mintKIP7TokenDTO.fromAddress,
        feeDelegation: true,
        feePayer: config.kaia.adminAddress
    })
}

const burnFromKIP7Token = async (burnFromKIP7TokenDTO) => {
    const kip7 = await caver.kct.kip7.create(burnFromKIP7TokenDTO.contractAddress)

    return await kip7.burnFrom(burnFromKIP7TokenDTO.spenderAddress, caver.utils.toPeb(burnFromKIP7TokenDTO.amount, 'KLAY'), {
        from: burnFromKIP7TokenDTO.fromAddress,
        feeDelegation: true,
        feePayer: config.kaia.adminAddress
    })
}

const allowanceKIP7Token = async (owner, spender, contractAddress) => {
    // const owner  // 소유자
    // const spender  // 소유자를 대신하여 토큰을 사용하는 계정의 주소입니다.
    const kip7 = await caver.kct.kip7.create(contractAddress)
    return await kip7.allowance(owner, spender)
}

const balanceOfKIP7Token = async (address, contractAddress) => {

    const kip7 = await caver.kct.kip7.create(contractAddress)
    return await kip7.balanceOf(address)
}

const decodeRawTransaction = async (rawTransaction) => {
    return caver.transaction.decode(rawTransaction)
}

const toPeb = async (number, unit) => { return caver.utils.toPeb(number, unit) }

const fromPeb = async (number, unit) => { return parseInt(caver.utils.fromPeb(number, unit)) }

const toBN = async (value) => { return caver.utils.toBN(value) }

const sendRawTransactionWithSignAsFeePayer = async (rawTransaction) => {
    // todo : error 처리
    const decodedTransaction = caver.transaction.feeDelegatedSmartContractExecution.decode(rawTransaction)

    // feePayer 서명 추가
    const SignedTransaction = await caver.wallet.signAsFeePayer(config.kaia.adminAddress, decodedTransaction)

    // 최종 트랜잭션 전송
    const finalRawTransaction = SignedTransaction.getRawTransaction()
    const receipt = await caver.rpc.klay.sendRawTransaction(finalRawTransaction)

    return receipt
}

// rawTransaction 생성 코드 입니다. 테스트 용 코드입니다
const generateApproveRawTransaction = async (ownerAddress, ownerPrivateKey, spenderAddress, contractAddress) => {
    const caver = new Caver('https://public-en-baobab.klaytn.net/')
    caver.wallet.newKeyring(ownerAddress, ownerPrivateKey)
    const kip7 = await caver.kct.kip7.create(contractAddress)
	

    const approveData = kip7.methods.approve(spenderAddress, constants.MAX_APPROVE_AMOUNT).encodeABI()
    const nonce = await caver.rpc.klay.getTransactionCount(ownerAddress)
    const gas = await caver.rpc.klay.estimateGas({
        type: "FEE_DELEGATED_SMART_CONTRACT_EXECUTION",
        from: ownerAddress,
        to: contractAddress,
        input: approveData,
        value: '0',
      })

    const gasLimit = 1000000;
    const signApproveTx = await caver.transaction.feeDelegatedSmartContractExecution.create({
        from: ownerAddress,
        to: contractAddress,
        input: approveData,
        gas: gasLimit,
        nonce: nonce,
    })

    // 소유자 서명
    const signedTx = await caver.wallet.sign(ownerAddress, signApproveTx)
    const rawTransaction = signedTx.getRLPEncoding() // 서명된 트랜잭션의 RLP 인코딩

    return rawTransaction
}


const decodeApproveABI = async (inputData) => {
    // ABI 정의
    const approveABI = [
        {
            "constant": false,
            "inputs": [
                { "name": "spender", "type": "address" },
                { "name": "value", "type": "uint256" }
            ],
            "name": "approve",
            "outputs": [
                { "name": "", "type": "bool" }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    // ABI 디코딩
    const decodedParams = caver.abi.decodeParameters(approveABI[0].inputs, inputData.slice(10));

    return { spender: decodedParams.spender, value: decodedParams.value };
}

const getStudentsRankingRange = async (from, to, contractAddress) => {

    const swMileageTokenContract = new caver.contract.create(SWMileageABI, contractAddress);

    const rankList = await swMileageTokenContract.call('getRankingRange', from, to);

    return rankList
}

// addAdmin 권한 넘겨준 후 fee Payer가 모두 add 하는 과정
const addAdminByFeePayer = async (address, contractAddress) => {
    // try {
        const swMileageTokenContract = new caver.contract.create(SWMileageABI, contractAddress);
        console.log(`add admin address ${address}`)
        const isAdmin = await swMileageTokenContract.call('isAdmin', address);

        if (!isAdmin) {
            try {
                const result = await swMileageTokenContract.methods.addAdmin(address).send({
                    from: config.kaia.adminAddress,
                    gas: constants.DEPLOY_KIP7_GAS
                })

                // result false이면 logging
            } catch (error) {
                // todo : logging
                print(`[ERROR] with add admin address ${address}`)
            }
        }
        // todo: 이미 admin이면 method 안 보내기
    // } catch (error) {
    //     throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
    // }
}

const removeAdminByFeePayer = async (address, contractAddress) => {
    try {
        const swMileageTokenContract = new caver.contract.create(SWMileageABI, contractAddress);
        console.log(`remove admin address ${address}`)
        const result = await swMileageTokenContract.methods.removeAdmin(address).send({
            from: config.kaia.adminAddress,
            gas: constants.DEPLOY_KIP7_GAS
        })

        return result
    } catch (error) {
        throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
    }
}

const getSWMileageContractCode = () => {
    // TODO: ABIcode 다양해 지는 경우 수정
    const contractCode = {
        abi: SWMileageABI,
        bytecode: SWMileageByte,
      };

    return contractCode
}

module.exports = {
    keyringCreateFromPrivateKey,
    deployKIP7Token,
    deployCustomKIP7Token,
    mintKIP7Token,
    burnFromKIP7Token,
    addAdminKeyringAtCaverJs,
    decodeRawTransaction,
    toPeb,
    fromPeb,
    sendRawTransactionWithSignAsFeePayer,
    allowanceKIP7Token,
    balanceOfKIP7Token,
    decodeApproveABI,
    deployCustomKIP7TokenAsFeePayer,

    getStudentsRankingRange,
    toBN,
    addAdminKeyring,
    createKeyRing,
    getSWMileageContractCode,
    addAdminByFeePayer,
    removeAdminByFeePayer,
}

