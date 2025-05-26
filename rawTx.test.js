// rlpEncodingString.test.js
// 테스트용: 회원가입(registerStudent) 관련 rawTransaction 생성 및 서명 스크립트
// 실행 전, 필요한 환경변수 설정:
// TEST_STUDENT_ID, TEST_STUDENT_ADDRESS, TEST_STUDENT_PRIVATE_KEY

const dotenv = require('dotenv').config();
const Caver = require('caver-js');
const config = require('./src/config/config');
const constants = require('./src/config/constants');

// StudentManager ABI 및 주소 가져오기
const smAbi = require('./src/utils/data/contract/StudentManager.abi.json');
const smAddress = config.contract.studentManagerContractAddress

// Caver 인스턴스 생성
const caver = new Caver(config.kaia.kaiaRpcUrl);

/**
 * 테스트용으로 학생 등록용 unsigned rawTransaction 생성
 * @returns {Promise<string>} RLP 인코딩된 unsigned rawTx
 */
async function createRegisterStudentRawTransaction(studentIdString, studentAddress) {
    // 1) ABI 바인딩
    const sm = new caver.contract.create(smAbi, smAddress);
    // 2) 학번을 bytes32로 변환
    const hexId = caver.utils.toHex(studentIdString);
    const studentId = caver.utils.padRight(hexId, 64);
    // 3) nonce 조회 및 input 데이터 준비
    const nonce = await caver.rpc.klay.getTransactionCount(studentAddress);

    const input = sm.methods.registerStudent(studentId).encodeABI();
    // console.log("input>> ", input)
    // console.log("studentId>> ", studentIdString)

    // ↓ 시뮬레이션: call()을 통해 revert 메시지를 바로 확인
    try {
    await sm.methods.registerStudent(studentId)
        .call({ from: studentAddress });
    console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
    console.error('학생 회원가입 :: call()에서 revert됨:', err.message);
    process.exit(1);
    }


    console.log("From>> ", smAddress)
    const gasPrice = await caver.rpc.klay.getGasPrice();
    // 4) feeDelegatedSmartContractExecution 트랜잭션 생성
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from:  studentAddress,
        to:    smAddress,
        input: input,
        gas: 1000000,
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedRegisterTx() {
    const studentAddress = process.env.TEST_STUDENT_ADDRESS;
    const studentPrivateKey = process.env.TEST_STUDENT_PRIVATE_KEY;
    const studentId = process.env.TEST_STUDENT_ID;

    if (!studentAddress || !studentPrivateKey || !studentId) {
        console.error('환경변수 TEST_STUDENT_ADDRESS, TEST_STUDENT_PRIVATE_KEY, TEST_STUDENT_ID를 설정하세요.');
        process.exit(1);
    }

    // 1) unsigned rawTransaction 생성
    const unsignedRawTx = await createRegisterStudentRawTransaction(
        studentId,
        studentAddress
    );

    //console.log('Unsigned Raw TX:', unsignedRawTx);

    // 2) Keyring 추가 (학생 개인키)
    const keyring = caver.wallet.keyring.createFromPrivateKey(studentPrivateKey);
    caver.wallet.add(keyring);

    // 3) rawTransaction 디코딩
    const tx = caver.transaction
        .feeDelegatedSmartContractExecution
        .decode(unsignedRawTx);

    // 4) 학생 서명
    const signedTx = await caver.wallet.sign(
        studentAddress,
        tx
    );

    // 5) 최종 rawTransaction 획득
    const studentSignedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed RegisterStudent Raw Transaction ===');
    console.log(studentSignedRawTx);
}

const fs = require('fs');
const crypto = require('crypto');

/**
 * 파일 경로로부터 SHA256 해시값을 생성 (hex string)
 */
function getFileHashSync(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    return '0x' + hash;
}

/**
 * DocSubmit 트랜잭션을 위한 unsigned rawTx 생성 (Klaytn용)
 * @param {string} filePath  // 제출할 파일의 경로
 * @param {string} senderAddress // 트랜잭션 보내는 사용자 주소
 * @returns {Promise<string>} RLP 인코딩된 unsigned rawTx
 */
async function createDocSubmitRawTransaction(filePath, senderAddress) {
    // 1) ABI 바인딩
    const sm = new caver.contract.create(smAbi, smAddress);
    let fileHash;
    // 2) 파일 해시 생성
    if (!filePath || filePath === '0x00') {
        fileHash = filePath
    }
    else{
        fileHash = getFileHashSync(filePath); // 위 함수 사용
    }
    
    // 3) nonce 조회
    const nonce = await caver.rpc.klay.getTransactionCount(senderAddress);

    // 4) input 데이터 준비 (함수명/파라미터에 맞게)
    const input = sm.methods.submitDocument(fileHash).encodeABI();

    // ↓ revert 체크 (옵션)
    try {
        await sm.methods.submitDocument(fileHash).call({ from: senderAddress });
        console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
        console.error('문서 제출 :: call()에서 revert됨:', err.message);
        process.exit(1);
    }

    const gasPrice = await caver.rpc.klay.getGasPrice();
    // 5) feeDelegatedSmartContractExecution 트랜잭션 생성
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from: senderAddress,
        to: smAddress,
        input: input,
        gas: 1000000,
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedDocSubmitTx(filePath='0x00') {
    const studentAddress = process.env.TEST_STUDENT_ADDRESS;
    const studentPrivateKey = process.env.TEST_STUDENT_PRIVATE_KEY;
    if (!studentAddress || !studentPrivateKey) {
        console.error('환경변수 TEST_STUDENT_ADDRESS, TEST_STUDENT_PRIVATE_KEY를 설정하세요.');
        process.exit(1);
    }

    // 1) unsigned rawTx 생성
    const unsignedRawTx = await createDocSubmitRawTransaction(filePath, studentAddress);

    // // 2) Keyring 추가 (개인키)
    // const keyring = caver.wallet.keyring.createFromPrivateKey(studentPrivateKey);
    // caver.wallet.add(keyring);

    // 2. 이미 키링이 wallet에 등록되어 있는지 확인
    if (!caver.wallet.getKeyring(studentAddress)) {
        // 3. 없으면 등록
        const keyring = caver.wallet.keyring.createFromPrivateKey(studentPrivateKey);
        caver.wallet.add(keyring);
    } else {
}

    // 3) rawTx 디코딩
    const tx = caver.transaction
        .feeDelegatedSmartContractExecution
        .decode(unsignedRawTx);

    // 4) 서명
    const signedTx = await caver.wallet.sign(studentAddress, tx);

    // 5) 최종 rawTx
    const studentSignedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed DocSubmit Raw Transaction ===');
    console.log(studentSignedRawTx);
    return studentSignedRawTx;
}

/**
 * addAdmin(address) 함수용 unsigned rawTransaction 생성
 * @param {string} adminAddress 추가할 어드민의 EOA 주소 (0x...)
 * @param {string} senderAddress 트랜잭션을 보낼 주체의 주소 (보통 어드민 계정, fee payer 등)
 * @returns {Promise<string>} RLP 인코딩된 unsigned rawTx
 */
async function createAddAdminRawTransaction(adminAddress, senderAddress) {
    // 1) ABI 바인딩
    const sm = new caver.contract.create(smAbi, smAddress);

    // 2) input 데이터 준비
    const input = sm.methods.addAdmin(adminAddress).encodeABI();

    // 3) nonce 및 gasPrice 조회
    const nonce = await caver.rpc.klay.getTransactionCount(senderAddress);
    const gasPrice = await caver.rpc.klay.getGasPrice();

    // 4) (option) call()로 revert 사전 체크
    try {
        await sm.methods.addAdmin(adminAddress)
            .call({ from: senderAddress });
        console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
        console.error('addAdmin :: call()에서 revert됨:', err.message);
        process.exit(1);
    }

    // 5) feeDelegatedSmartContractExecution 트랜잭션 생성
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from: senderAddress,
        to: smAddress,
        input: input,
        gas: 300000,  // addAdmin은 보통 gas 많이 안 먹음. 여유있게 조정 가능.
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedAddAdminTx() {
    const senderAddress = process.env.TEST_ADMIN_ADDRESS; // 트랜잭션 보내는 주체
    const senderPrivateKey = process.env.TEST_ADMIN_PRIVATE_KEY;
    const newAdminAddress = process.env.NEW_ADMIN_ADDRESS; // 실제로 add할 어드민 주소

    if (!senderAddress || !senderPrivateKey || !newAdminAddress) {
        console.error('환경변수 TEST_ADMIN_ADDRESS, TEST_ADMIN_PRIVATE_KEY, NEW_ADMIN_ADDRESS를 설정하세요.');
        process.exit(1);
    }

    // 1) unsigned rawTransaction 생성
    const unsignedRawTx = await createAddAdminRawTransaction(
        newAdminAddress,
        senderAddress
    );

    // 2) Keyring 추가
    const keyring = caver.wallet.keyring.createFromPrivateKey(senderPrivateKey);
    caver.wallet.add(keyring);

    // 3) rawTransaction 디코딩
    const tx = caver.transaction
        .feeDelegatedSmartContractExecution
        .decode(unsignedRawTx);

    // 4) 트랜잭션 서명
    const signedTx = await caver.wallet.sign(
        senderAddress,
        tx
    );

    // 5) 최종 rawTransaction 획득
    const adminSignedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed AddAdmin Raw Transaction ===');
    console.log(adminSignedRawTx);
}

// ====== 디코딩 테스트 ===
// 1. selector => 함수 ABI mapping 자동 생성
function buildSelectorMap(abi) {
    const selectorMap = {};
    abi.forEach(item => {
        if (item.type === 'function') {
            // 시그니처 문자열 생성: 함수명(타입1,타입2,...)
            const types = item.inputs.map(i => i.type).join(',');
            const signature = `${item.name}(${types})`;
            // selector 구하기
            const selector = caver.utils.sha3(signature).slice(0, 10);
            selectorMap[selector] = item;
        }
    });
    return selectorMap;
}
const selectorMap = buildSelectorMap(smAbi);

/**
 * 트랜잭션 input (data) 자동 디코드
 * @param {string} input 0x~ 트랜잭션 input 전체 데이터
 * @returns {Object} { function: '함수명', params: {...}, selector: ... }
 */
function decodeTxInputAuto(input) {
    const selector = input.slice(0, 10);
    const paramsData = '0x' + input.slice(10);

    if (!selectorMap[selector]) {
        throw new Error('Unknown function selector: ' + selector);
    }
    const abiItem = selectorMap[selector];
    // 파라미터명, 타입 자동 매핑
    const paramDefs = abiItem.inputs.map(i => ({ name: i.name, type: i.type }));

    // decode
    const decoded = caver.abi.decodeParameters(paramDefs, paramsData);
    // 파라미터명별로 깔끔하게 정리 (caver/web3는 0,1,2... + 이름 키 모두 제공)
    const params = {};
    abiItem.inputs.forEach(i => {
        params[i.name] = decoded[i.name];
    });

    return {
        function: abiItem.name,
        params,
        selector,
    };
}

async function decode(input) {
    const params = "0x" + input.slice(10);
    const decoded = caver.abi.decodeParameters(
    [{ name:"studentId", type:"bytes32" }],
    params
    );
    //console.log("Decoded studentId: ", decoded);

    // 2) hex → BN → 10진수 문자열
    const bn = caver.utils.toBN(decoded.studentId);
    const studentIdDecimal = bn.toString();
    console.log('Student ID (decimal):', studentIdDecimal);

    // let hexId = decoded.studentId;                // e.g. 0x31303331…000000
    // hexId = hexId.replace(/(00)+$/g, '');
    // console.log("hexId: ", hexId); // e.g. 0x31303331
    // const studentIdString = caver.utils.hexToUtf8(hexId);
    // console.log("studentIdString: ", studentIdString); // e.g. 1031

}
//decode("0x2fe2cdfa78b4ee7f00000000000000000000000000000000000000000000000000000000")

//학생 회원가입 tx 생성
(async () => {
    try {
        
        let rawTx = await generateSignedRegisterTx().catch(console.error);
        // decode
        console.log("학생 회원가입");
        const decoded = caver.transaction.decode(rawTx);
        const info = decodeTxInputAuto(decoded.input);
        console.log("함수명:", info.function);
        console.log("파라미터:", info.params);
        console.log("rawTx: ", rawTx);
    } catch (err) {
        console.error(err);
    }
})();

// 문서 제출 tx 생성
//generateSignedDocSubmitTx("./rawTx.jpeg").catch(console.error);
// (async () => {
//     try {
        
//         let rawTx = await generateSignedDocSubmitTx();
//         // decode
//         console.log("문서 제출 with no file");
//         const decoded = caver.transaction.decode(rawTx);
//         const info = decodeTxInputAuto(decoded.input);
//         console.log("함수명:", info.function);
//         console.log("파라미터:", info.params);
//         console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// })();

// (async () => {
//     try {
        
//         let rawTx = await generateSignedDocSubmitTx("./rawTx.jpeg");
//         // decode
//         console.log("문서 제출 with single(=mutiple) file(s)");
//         const decoded = caver.transaction.decode(rawTx);
//         const info = decodeTxInputAuto(decoded.input);
//         console.log("함수명:", info.function);
//         console.log("파라미터:", info.params);
//         console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// })();


// //어드민 회원가입
// (async () => {
//     try {
        
//         let rawTx = await generateSignedAddAdminTx();
//         // decode
//         console.log("어드민 회원가입");
//         const decoded = caver.transaction.decode(rawTx);
//         const info = decodeTxInputAuto(decoded.input);
//         console.log("함수명:", info.function);
//         console.log("파라미터:", info.params);
//         console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// }
// )();