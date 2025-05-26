const Caver = require("caver-js");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const constants = require("../config/constants");
const SWMileageABI = require("../utils/data/contract/SwMileageABI.json");
const SWMileageByte = require("../utils/data/contract/SwMileageByte");
const httpStatus = require("http-status");

// 마일리지 신청관련 로직 테스트를 위한 ABI, BYTE
const SWMileageTokenABI = require("../utils/data/contract/SwMileageToken.abi.json");
const SWMileageTokenByte = require("../utils/data/contract/SwMileageToken.bytecode");
const StudentManagerABI = require("../utils/data/contract/StudentManager.abi.json");
const StudentManagerByte = require("../utils/data/contract/StudentManager.bytecode");

const caver = new Caver(config.kaia.kaiaRpcUrl);

const keyringCreateFromPrivateKey = async () => {
  const keyringFromPrivateKey = caver.wallet.keyring.createFromPrivateKey(
    config.kaia.adminPrivateKey
  );

  return keyringFromPrivateKey;
};

const createKeyRing = async (privateKey) => {
  const privateKeyInstance =
    caver.wallet.keyring.createFromPrivateKey(privateKey);

  return privateKeyInstance;
};

// caver에 keyring 추가
async function addAdminKeyringAtCaverJs() {
  const addedSingle = caver.wallet.newKeyring(
    config.kaia.adminAddress,
    config.kaia.adminPrivateKey
  );
  return addedSingle;
}

const addAdminKeyring = async (adminKeyring) => {
  caver.wallet.add(adminKeyring);
};

const deployKIP7Token = async (deployKIP7TokenDTO) => {
  try {
    const kip7Token = await caver.kct.kip7.deploy(
      {
        name: deployKIP7TokenDTO.name,
        symbol: deployKIP7TokenDTO.symbol,
        decimals: deployKIP7TokenDTO.decimals,
        initialSupply: deployKIP7TokenDTO.initialSupply,
      },
      {
        from: deployKIP7TokenDTO.deployAddress,
        feeDelegation: true,
        feePayer: config.kaia.adminAddress,
      }
    );
    return kip7Token;
  } catch (error) {
    throw new ApiError(
      error.response.status,
      error.response.data.message ?? error.response.data
    );
  }
};

// transfer 기능이 막힌 KIP7 contract 를 deploy 하는 함수입니다.
const deployCustomKIP7Token = async (deployKIP7TokenDTO) => {
  try {
    const swMileageTokenContract = new caver.contract.create(SWMileageABI);

    const swMileageToken = await swMileageTokenContract.deploy(
      {
        from: deployKIP7TokenDTO.deployAddress,
        gas: constants.DEPLOY_KIP7_GAS,
        feeDelegation: true,
        feePayer: config.kaia.adminAddress,
      },
      `0x${SWMileageByte}`,
      deployKIP7TokenDTO.name,
      deployKIP7TokenDTO.symbol
    );
    return swMileageToken;
  } catch (error) {
    console.log(error);
    throw new ApiError(
      error.response.status,
      error.response.data.message ?? error.response.data
    );
  }
};

// rlpEncoding 값을 받아서 feepayer의 서명을 통해 배포하는 함수 입니다.
const deployCustomKIP7TokenAsFeePayer = async (rlpEncodingString) => {
  try {
    // 클라이언트(A)가 서명한 트랜잭션 디코딩
    const deployTransaction =
      caver.transaction.feeDelegatedSmartContractDeploy.create(
        rlpEncodingString
      );
    console.log("Decoded Transaction:", deployTransaction);

    // Fee Payer(B)가 추가 서명
    const signedTransaction = await caver.wallet.signAsFeePayer(
      config.kaia.adminAddress,
      deployTransaction
    );
    console.log("Signed Transaction by Fee Payer:", signedTransaction);
    const txHash = signedTransaction.getTransactionHash();
    console.log("Transaction Hash:", txHash);
    // 최종 서명된 트랜잭션을 네트워크에 전송
    const receipt = await caver.rpc.klay.sendRawTransaction(
      signedTransaction.getRawTransaction()
    );

    console.log("Transaction Receipt:", receipt);
    return receipt.contractAddress;
  } catch (error) {
    console.error("Transaction error:", error);
    throw new ApiError(error.response?.status || 500, error.message);
  }
};

const mintKIP7Token = async (mintKIP7TokenDTO) => {
  const kip7 = await caver.kct.kip7.create(mintKIP7TokenDTO.contractAddress);

  return await kip7.mint(
    mintKIP7TokenDTO.spenderAddress,
    caver.utils.toPeb(mintKIP7TokenDTO.amount, "KLAY"),
    {
      from: mintKIP7TokenDTO.fromAddress,
      feeDelegation: true,
      feePayer: config.kaia.adminAddress,
    }
  );
};

const burnFromKIP7Token = async (burnFromKIP7TokenDTO) => {
  const kip7 = await caver.kct.kip7.create(
    burnFromKIP7TokenDTO.contractAddress
  );

  return await kip7.burnFrom(
    burnFromKIP7TokenDTO.spenderAddress,
    caver.utils.toPeb(burnFromKIP7TokenDTO.amount, "KLAY"),
    {
      from: burnFromKIP7TokenDTO.fromAddress,
      feeDelegation: true,
      feePayer: config.kaia.adminAddress,
    }
  );
};

const allowanceKIP7Token = async (owner, spender, contractAddress) => {
  // const owner  // 소유자
  // const spender  // 소유자를 대신하여 토큰을 사용하는 계정의 주소입니다.
  const kip7 = await caver.kct.kip7.create(contractAddress);
  return await kip7.allowance(owner, spender);
};

const balanceOfKIP7Token = async (address, contractAddress) => {
  const kip7 = await caver.kct.kip7.create(contractAddress);
  return await kip7.balanceOf(address);
};

const decodeRawTransaction = async (rawTransaction) => {
  return caver.transaction.decode(rawTransaction);
};

const toPeb = async (number, unit) => {
  return caver.utils.toPeb(number, unit);
};

const fromPeb = async (number, unit) => {
  return parseInt(caver.utils.fromPeb(number, unit));
};

const toBN = async (value) => {
  return caver.utils.toBN(value);
};

const sendRawTransactionWithSignAsFeePayer = async (rawTransaction) => {
  // todo : error 처리
  try {
    const decodedTransaction =
      caver.transaction.feeDelegatedSmartContractExecution.decode(
        rawTransaction
      );
    // feePayer 서명 추가
    const SignedTransaction = await caver.wallet.signAsFeePayer(
      config.kaia.adminAddress,
      decodedTransaction
    );

    // 최종 트랜잭션 전송
    const finalRawTransaction = SignedTransaction.getRawTransaction();
    const receipt = await caver.rpc.klay.sendRawTransaction(
      finalRawTransaction
    );

    return receipt;
  } catch (error) {
    console.error("Error sending raw transaction:", error.message);
    throw new ApiError(error.response?.status || 500, error.message);
  }
};

// rawTransaction 생성 코드 입니다. 테스트 용 코드입니다
const generateApproveRawTransaction = async (
  ownerAddress,
  ownerPrivateKey,
  spenderAddress,
  contractAddress
) => {
  const caver = new Caver("https://public-en-baobab.klaytn.net/");
  caver.wallet.newKeyring(ownerAddress, ownerPrivateKey);
  const kip7 = await caver.kct.kip7.create(contractAddress);

  const approveData = kip7.methods
    .approve(spenderAddress, constants.MAX_APPROVE_AMOUNT)
    .encodeABI();
  const nonce = await caver.rpc.klay.getTransactionCount(ownerAddress);
  const gas = await caver.rpc.klay.estimateGas({
    type: "FEE_DELEGATED_SMART_CONTRACT_EXECUTION",
    from: ownerAddress,
    to: contractAddress,
    input: approveData,
    value: "0",
  });

  const gasLimit = 1000000;
  const signApproveTx =
    await caver.transaction.feeDelegatedSmartContractExecution.create({
      from: ownerAddress,
      to: contractAddress,
      input: approveData,
      gas: gasLimit,
      nonce: nonce,
    });

  // 소유자 서명
  const signedTx = await caver.wallet.sign(ownerAddress, signApproveTx);
  const rawTransaction = signedTx.getRLPEncoding(); // 서명된 트랜잭션의 RLP 인코딩

  return rawTransaction;
};

const decodeApproveABI = async (inputData) => {
  // ABI 정의
  const approveABI = [
    {
      constant: false,
      inputs: [
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      payable: false,
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  // ABI 디코딩
  const decodedParams = caver.abi.decodeParameters(
    approveABI[0].inputs,
    inputData.slice(10)
  );

  return { spender: decodedParams.spender, value: decodedParams.value };
};

const getStudentsRankingRange = async (from, to, contractAddress) => {
  const swMileageTokenContract = new caver.contract.create(
    SWMileageABI,
    contractAddress
  );

  const rankList = await swMileageTokenContract.call(
    "getRankingRange",
    from,
    to
  );

  return rankList;
};

const addAdminByFeePayer = async (address, contractAddress) => {
  const studentManagerFactoryContract = new caver.contract.create(
    StudentManagerABI,
    contractAddress
  );
  const isAdmin = await studentManagerFactoryContract.call("isAdmin", address);
  if (isAdmin) {
    throw new ApiError(httpStatus.BAD_REQUEST, "address is already admin");
  }
  try {
    const result = await studentManagerFactoryContract.methods
      .addAdmin(address)
      .send({
        from: config.kaia.adminAddress,
        gas: constants.DEPLOY_KIP7_GAS,
      });
    return result;
  } catch (error) {
    throw new ApiError(
      error.response.status,
      error.response.data.message ?? error.response.data
    );
  }
};

// addAdmin 권한 넘겨준 후 fee Payer가 모두 add 하는 과정
const addAdminByFeePayerLegacy = async (address, contractAddress) => {
  // try {
  const swMileageTokenContract = new caver.contract.create(
    SWMileageABI,
    contractAddress
  );
  console.log(`add admin address ${address}`);
  const isAdmin = await swMileageTokenContract.call("isAdmin", address);

  if (!isAdmin) {
    try {
      const result = await swMileageTokenContract.methods
        .addAdmin(address)
        .send({
          from: config.kaia.adminAddress,
          gas: constants.DEPLOY_KIP7_GAS,
        });

      // result false이면 logging
    } catch (error) {
      // todo : logging
      console.log(`[ERROR] with add admin address ${address}`);
    }
  }
  // todo: 이미 admin이면 method 안 보내기
  // } catch (error) {
  //     throw new ApiError(error.response.status, error.response.data.message ?? error.response.data);
  // }
};

const removeAdminByFeePayer = async (address, contractAddress) => {
  try {
    const swMileageTokenContract = new caver.contract.create(
      SWMileageABI,
      contractAddress
    );
    console.log(`remove admin address ${address}`);
    const result = await swMileageTokenContract.methods
      .removeAdmin(address)
      .send({
        from: config.kaia.adminAddress,
        gas: constants.DEPLOY_KIP7_GAS,
      });

    return result;
  } catch (error) {
    throw new ApiError(
      error.response.status,
      error.response.data.message ?? error.response.data
    );
  }
};

// const getSWMileageContractCode = () => {
//   // TODO: ABIcode 다양해 지는 경우 수정
//   const contractCode = {
//     abi: SWMileageABI,
//     bytecode: SWMileageByte,
//   };

//   return contractCode
// }
const getSWMileageContractCode = () => {
  // TODO: ABIcode 다양해 지는 경우 수정
  // 현재 2개로 변경함.
  const contractCode = {
    studentManager: {
      abi: StudentManagerABI,
      bytecode: StudentManagerByte,
    },
    swMileageToken: {
      abi: SWMileageTokenABI,
      bytecode: SWMileageTokenByte,
    },
  };

  return contractCode;
};

// ====================
// new functions
// ====================
// 1. selector => 함수 ABI mapping 자동 생성
function buildSelectorMap(abis) {
  const selectorMap = {};
  abis.forEach((abi) => {
    abi.forEach((item) => {
      if (item.type === "function") {
        // 시그니처 문자열 생성: 함수명(타입1,타입2,...)
        const types = item.inputs.map((i) => i.type).join(",");
        const signature = `${item.name}(${types})`;
        // selector 구하기
        const selector = caver.utils.sha3(signature).slice(0, 10);
        selectorMap[selector] = item;
      }
    });
  });
  return selectorMap;
}
const selectorMap = buildSelectorMap([StudentManagerABI, SWMileageTokenABI]);
/**
 * 트랜잭션 input (data) 자동 디코드
 * @param {string} input 0x~ 트랜잭션 input 전체 데이터
 * @returns {Object} { function: '함수명', params: {...}, selector: ... }
 */
function decodeTxInputAuto(input) {
  const selector = input.slice(0, 10);
  const paramsData = "0x" + input.slice(10);

  if (!selectorMap[selector]) {
    throw new Error("Unknown function selector: " + selector);
  }
  const abiItem = selectorMap[selector];
  // 파라미터명, 타입 자동 매핑
  const paramDefs = abiItem.inputs.map((i) => ({ name: i.name, type: i.type }));

  // decode
  const decoded = caver.abi.decodeParameters(paramDefs, paramsData);
  // 파라미터명별로 깔끔하게 정리 (caver/web3는 0,1,2... + 이름 키 모두 제공)
  const params = {};
  abiItem.inputs.forEach((i) => {
    params[i.name] = decoded[i.name];
  });

  return {
    function: abiItem.name,
    params,
    selector,
  };
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
  addAdminByFeePayerLegacy,
  removeAdminByFeePayer,
  //new functions
  decodeTxInputAuto,
};
