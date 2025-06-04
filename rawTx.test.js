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

// 새 토큰 발급을 위한 Factory ABI 및 주소 가져오기
const factoryAbi = require('./src/utils/data/contract/SwMileageTokenFactory.abi.json');
const factoryAddress = config.contract.swMileageTokenFactoryAddress;

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
    console.log("studentId>> ", studentId)
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

//admin 회원가입 ========== 사용할 필요 없어짐.
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

//토큰 배포 with admin
async function createDeployWithAdminRawTransaction(name, symbol, admin, senderAddress) {
    // 1) ABI 바인딩
    const factory = new caver.contract.create(factoryAbi, factoryAddress);

    // 2) input 데이터 준비
    const input = factory.methods.deployWithAdmin(name, symbol, admin).encodeABI();

    // 3) nonce, gasPrice 조회
    const nonce = await caver.rpc.klay.getTransactionCount(senderAddress);
    const gasPrice = await caver.rpc.klay.getGasPrice();

    // (option) call()로 배포 가능 여부 확인
    try {
        await factory.methods.deployWithAdmin(name, symbol, admin)
            .call({ from: senderAddress });
        console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
        console.error('토큰 배포 :: call()에서 revert됨:', err.message);
        process.exit(1);
    }

    // 4) feeDelegatedSmartContractExecution 트랜잭션 생성
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from: senderAddress,
        to: factoryAddress,
        input: input,
        gas: 2000000, // 토큰 배포이므로 충분히 높게!
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedDeployWithAdminTx() {
    const senderAddress = process.env.TEST_ADMIN_ADDRESS;
    const senderPrivateKey = process.env.TEST_ADMIN_PRIVATE_KEY;
    const tokenName = process.env.NEW_TOKEN_NAME;      // 예: "2024-2 Mileage"
    const tokenSymbol = process.env.NEW_TOKEN_SYMBOL;  // 예: "M24S2"
    const adminAddress = process.env.NEW_TOKEN_ADMIN;  // 배포할 토큰의 어드민

    if (!senderAddress || !senderPrivateKey || !tokenName || !tokenSymbol || !adminAddress) {
        console.error('환경변수 TEST_ADMIN_ADDRESS, TEST_ADMIN_PRIVATE_KEY, NEW_TOKEN_NAME, NEW_TOKEN_SYMBOL, NEW_TOKEN_ADMIN을 설정하세요.');
        process.exit(1);
    }

    // 1) unsigned rawTransaction 생성
    const unsignedRawTx = await createDeployWithAdminRawTransaction(
        tokenName,
        tokenSymbol,
        adminAddress,
        senderAddress
    );

    // 2) Keyring 추가
    const keyring = caver.wallet.keyring.createFromPrivateKey(senderPrivateKey);
    caver.wallet.add(keyring);

    // 3) rawTx 디코딩
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

    console.log('=== Signed DeployWithAdmin Raw Transaction ===');
    console.log(adminSignedRawTx);
}

//마일리지 승인
async function createApproveDocumentRawTransaction(documentIndex, amount, reasonHash, senderAddress) {
    const sm = new caver.contract.create(smAbi, smAddress);

    const nonce = await caver.rpc.klay.getTransactionCount(senderAddress);

    // 32바이트 패딩 필요시 padRight 등 활용 (이미 0x...32글자면 그대로 사용)
    // const paddedReasonHash = caver.utils.padRight(reasonHash, 66);

    const input = sm.methods.approveDocument(documentIndex, amount, reasonHash).encodeABI();

    // (option) call()으로 미리 revert 체크
    try {
        await sm.methods.approveDocument(documentIndex, amount, reasonHash).call({ from: senderAddress });
        console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
        console.error('approveDocument :: call()에서 revert됨:', err.message);
        process.exit(1);
    }

    const gasPrice = await caver.rpc.klay.getGasPrice();
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from: senderAddress,
        to: smAddress,
        input: input,
        gas: 500000,  // 필요시 조정
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedApproveDocumentTx() {
    const senderAddress = process.env.TEST_ADMIN_ADDRESS;
    const senderPrivateKey = process.env.TEST_ADMIN_PRIVATE_KEY;
    const documentIndex = process.env.DOC_INDEX;    // 예: '1'
    const amount = process.env.DOC_AMOUNT;          // 예: '100'
    const reasonHash = Caver.utils.sha3(process.env.REASON_HASH);     // 예: '0x...' 32바이트

    if (!senderAddress || !senderPrivateKey || !documentIndex || !amount || !reasonHash) {
        console.error('필수 환경변수 누락: TEST_ADMIN_ADDRESS, TEST_ADMIN_PRIVATE_KEY, DOC_INDEX, DOC_AMOUNT, REASON_HASH');
        process.exit(1);
    }

    const unsignedRawTx = await createApproveDocumentRawTransaction(
        documentIndex, amount, reasonHash, senderAddress
    );

    const keyring = caver.wallet.keyring.createFromPrivateKey(senderPrivateKey);
    caver.wallet.add(keyring);

    const tx = caver.transaction.feeDelegatedSmartContractExecution.decode(unsignedRawTx);
    const signedTx = await caver.wallet.sign(senderAddress, tx);

    const adminSignedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed ApproveDocument Raw Transaction ===');
    console.log(adminSignedRawTx);
    return adminSignedRawTx;
}

async function generateSignedRejectDocumentTx() {
    const senderAddress = process.env.TEST_ADMIN_ADDRESS;
    const senderPrivateKey = process.env.TEST_ADMIN_PRIVATE_KEY;
    const documentIndex = process.env.DOC_INDEX;    // 예: '1'
    const reasonHash = Caver.utils.sha3("지급 거절");     // 예: '0x...' 32바이트

    if (!senderAddress || !senderPrivateKey || !documentIndex || !reasonHash) {
        console.error('필수 환경변수 누락: TEST_ADMIN_ADDRESS, TEST_ADMIN_PRIVATE_KEY, DOC_INDEX, REASON_HASH');
        process.exit(1);
    }

    // amount를 0으로
    const unsignedRawTx = await createApproveDocumentRawTransaction(
        documentIndex, 0, reasonHash, senderAddress
    );

    const keyring = caver.wallet.keyring.createFromPrivateKey(senderPrivateKey);
    caver.wallet.add(keyring);

    const tx = caver.transaction.feeDelegatedSmartContractExecution.decode(unsignedRawTx);
    const signedTx = await caver.wallet.sign(senderAddress, tx);

    const adminSignedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed RejectDocument Raw Transaction (amount=0) ===');
    console.log(adminSignedRawTx);
    return adminSignedRawTx;
}

async function createAccountChangeRawTransaction(studentIdString, currentAddress, targetAddress) {
    // 1) ABI 바인딩
    const sm = new caver.contract.create(smAbi, smAddress);

    // 2) 학번을 bytes32로 변환
    const hexId = caver.utils.toHex(studentIdString);
    const studentId = caver.utils.padRight(hexId, 64);
    console.log("studentId>> ", studentId);

    // 3) nonce 조회
    const nonce = await caver.rpc.klay.getTransactionCount(currentAddress);

    // 4) input 데이터 준비 (함수명만 다름!)
    const input = sm.methods.changeAccount(studentId, targetAddress).encodeABI();

    // ↓ 시뮬레이션
    try {
        await sm.methods.changeAccount(studentId, targetAddress)
            .call({ from: currentAddress });
        console.log('call() 성공: revert 없이 실행 가능');
    } catch (err) {
        console.error('계정변경 :: call()에서 revert됨:', err.message);
        process.exit(1);
    }

    const gasPrice = await caver.rpc.klay.getGasPrice();

    // 5) 트랜잭션 객체 생성
    const tx = caver.transaction.feeDelegatedSmartContractExecution.create({
        from:  currentAddress,
        to:    smAddress,
        input: input,
        gas: 1000000,
        nonce: nonce,
        gasPrice: gasPrice,
    });
    return tx.getRLPEncoding();
}

async function generateSignedAccountChangeTx() {
    const currentAddress = process.env.TEST_ADMIN_ADDRESS;
    const privateKey = process.env.TEST_ADMIN_PRIVATE_KEY;
    const studentId = process.env.TEST_STUDENT_ID;
    const targetAddress = process.env.TARGET_ADDRESS;

    if (!currentAddress || !privateKey || !studentId || !targetAddress) {
        console.error('환경변수(CURRENT_ADDRESS, CURRENT_PRIVATE_KEY, TEST_STUDENT_ID, TARGET_ADDRESS)를 설정하세요.');
        process.exit(1);
    }

    // 1) unsigned rawTransaction 생성
    const unsignedRawTx = await createAccountChangeRawTransaction(
        studentId,
        currentAddress,
        targetAddress
    );

    // 2) Keyring 추가
    const keyring = caver.wallet.keyring.createFromPrivateKey(privateKey);
    caver.wallet.add(keyring);

    // 3) rawTransaction 디코딩
    const tx = caver.transaction
        .feeDelegatedSmartContractExecution
        .decode(unsignedRawTx);

    // 4) 서명
    const signedTx = await caver.wallet.sign(currentAddress, tx);

    // 5) 최종 rawTransaction
    const signedRawTx = signedTx.getRLPEncoding();

    console.log('=== Signed AccountChange Raw Transaction ===');
    console.log(signedRawTx);
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

/////////////////////////////////////////
/////////////////////////////////////////
//트랜잭션 생성
//트랜잭션 생성
//트랜잭션 생성
/////////////////////////////////////////
/////////////////////////////////////////



//학생 회원가입 tx 생성
// (async () => {
//     try {
        
//         let rawTx = await generateSignedRegisterTx().catch(console.error);
//         // decode
//         console.log("학생 회원가입");
//         const decoded = caver.transaction.decode(rawTx);
//         const info = decodeTxInputAuto(decoded.input);
//         console.log("함수명:", info.function);
//         console.log("파라미터:", info.params);
//         console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// })();

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

// 토큰 배포
// (async () => {
//     try {
        
//         let rawTx = await generateSignedDeployWithAdminTx();
//         // decode
//         console.log("새 토큰 배포");
//         const decoded = caver.transaction.decode(rawTx);
//         const info = decodeTxInputAuto(decoded.input);
//         console.log("함수명:", info.function);
//         console.log("파라미터:", info.params);
//         console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// })();


// 마일리지 승인

// (async () => {
//     try {
        
//         let rawTx = await generateSignedApproveDocumentTx();
//         // decode
//         //console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// }
// )();

//마일리지 반려
// (async () => {
//     try {
        
//         let rawTx = await generateSignedRejectDocumentTx();
//         // decode
//         //console.log("rawTx: ", rawTx);
//     } catch (err) {
//         console.error(err);
//     }
// }
// )();


//계정 변경
(async () => {
    try {
        
        let rawTx = await generateSignedAccountChangeTx();
        // decode
        //console.log("rawTx: ", rawTx);
    } catch (err) {
        console.error(err);
    }
}
)();