 # 대화 기록: 앱 서버와 폴링 서버 간 데이터 정합성 아키텍처

---

### **User:** 만약 앱 서버 => 폴링 서버 통해서 트랜잭션이 하나 처리된다고 가정했을때 앱서버에서 데이터베이스에 데이터를 쓰고 저장하는 시점이 폴링 서버에서 이벤트를 받고 데이터를 쓰고 저장하는 것보다 늦을 수 가 있을까요 혹시?

예) 학생 회원가입 과정

앱서버
1. 트랜잭션 전송
2. 유저 정보 생성 (is_confirmed = 0)

폴링 서버
1. 이벤트 수신
2. 유저 상태 변경 (is_confirmed = 1)

여기서 앱 서버 1이 폴링 서버 2보다 느릴 수 있는 경우가 존재하는지가 궁금해서요

내가 다른분한테 질문한 내용인데 너는 어떻게 생각해?

### **AI:** 네, 다른 분께 질문하신 내용에 대해 제 의견을 말씀드리겠습니다.

결론부터 말씀드리면, **네, 충분히 가능한 시나리오이며 매우 중요한 포인트를 잘 짚으셨습니다.** 현재 설계는 '레이스 컨디션(Race Condition)'에 취약할 수 있습니다.

#### 왜 그런 문제가 발생할 수 있나요?

`앱 서버`의 작업과 `폴링 서버`의 작업은 트랜잭션 전송 이후 사실상 별개의 프로세스로 진행되기 때문입니다.

1.  **프로세스 A (앱 서버):** `트랜잭션 전송` → `DB에 유저 정보 생성 (is_confirmed = 0)`
2.  **프로세스 B (블록체인 & 폴링 서버):** `트랜잭션 전송` → `블록체인 컨펌 및 이벤트 발생` → `폴링 서버가 이벤트 수신` → `DB에서 유저 상태 변경 (is_confirmed = 1)`

여기서 **프로세스 A의 완료 시간**과 **프로세스 B의 완료 시간** 중 어느 것이 더 빠를지 보장할 수 없습니다.

*   **프로세스 A가 느려지는 경우:**
    *   앱 서버의 순간적인 부하(CPU, 메모리 사용량 급증)
    *   데이터베이스와의 네트워크 지연 또는 DB 자체의 부하
    *   앱 서버의 내부 로직이 비동기 큐(Queue) 방식으로 동작하여 DB 쓰기 작업이 지연되는 경우

*   **프로세스 B가 빨라지는 경우:**
    *   블록체인의 블록 생성 시간이 매우 짧은 경우 (특히 프라이빗 체인이나 테스트넷)
    *   폴링 서버의 이벤트 감지 주기(polling interval)가 매우 짧거나, WebSocket 같은 실시간 구독 방식을 사용하는 경우

#### 구체적인 시나리오 예시

1.  **T=0.0s:** 앱 서버가 블록체인으로 '학생 회원가입' 트랜잭션을 전송합니다.
2.  **T=0.1s:** 앱 서버가 DB에 유저 정보를 저장(`INSERT`)하려고 하지만, 순간적인 DB 부하로 인해 쓰기 작업이 지연됩니다.
3.  **T=1.0s:** 블록체인에서 트랜잭션이 매우 빠르게 처리되고, '회원가입 성공' 이벤트가 발생합니다.
4.  **T=1.1s:** 폴링 서버가 이벤트를 즉시 감지하고, 해당 학생 정보를 DB에서 찾습니다.
5.  **T=1.2s:** 폴링 서버가 `UPDATE users SET is_confirmed = 1 WHERE ...` 쿼리를 실행합니다. 하지만 2번 단계의 `INSERT`가 아직 완료되지 않았으므로, 업데이트할 대상 레코드가 존재하지 않습니다. 결과적으로 아무런 변경 없이 쿼리가 종료됩니다.
6.  **T=2.0s:** 마침내 앱 서버의 DB 쓰기 작업이 완료되어, `is_confirmed = 0` 상태의 유저 정보가 생성됩니다.

**최종 결과:** 블록체인 상에서는 처리가 완료되었지만, 우리 서비스의 DB에는 해당 유저가 영원히 `is_confirmed = 0` 인 상태로 남게 되는 심각한 데이터 불일치 문제가 발생합니다.

#### 어떻게 해결해야 할까요?

가장 안정적이고 일반적인 해결책은 **작업 순서를 변경**하는 것입니다.

**추천 해결책: DB에 먼저 기록 후 트랜잭션 전송**

1.  **앱 서버:**
    1.  DB에 유저 정보를 먼저 생성합니다. 이때 상태는 `PENDING` 또는 `is_confirmed = 0`으로 설정합니다. 이 레코드에는 나중에 트랜잭션 해시를 저장할 `tx_hash` 같은 컬럼을 비워둡니다.
    2.  블록체인으로 트랜잭션을 전송합니다.
    3.  트랜잭션이 성공적으로 전송되면, 반환받은 **트랜잭션 해시(tx_hash)를 1번에서 생성한 유저 레코드에 업데이트**합니다.

2.  **폴링 서버:**
    1.  이벤트를 수신합니다. 이벤트에는 `tx_hash`가 포함되어 있을 것입니다.
    2.  해당 `tx_hash`를 기준으로 DB에서 유저 레코드를 찾아 상태를 `CONFIRMED` 또는 `is_confirmed = 1`로 변경합니다.

**이 방식의 장점:**
이벤트가 발생했을 때 폴링 서버가 DB를 조회하는 시점에는, 해당 레코드가 이미 존재한다는 것이 보장됩니다. 따라서 위에서 설명한 레이스 컨디션을 원천적으로 방지할 수 있습니다.

요약하자면, 현재 우려하시는 상황은 충분히 발생 가능하며, 이를 방지하기 위해 **DB에 상태를 먼저 기록하고 트랜잭션을 전송하는 방식**으로 아키텍처를 개선하는 것을 강력히 권장합니다.

---

### **User:** 하나의 API요청에서 저렇게 순서를 보장하도록 구현할 수 있나? 이게 전에 우리가 구현했던 예시인데 이걸 바탕으로 어떻게 작성할 수 있는지 예시를 보여줄래?

### **AI:** 네, 그럼요. 제시해주신 코드를 바탕으로 어떻게 레이스 컨디션(Race Condition)을 해결하고 안정성을 높일 수 있는지 수정된 예시 코드를 보여드리겠습니다.

핵심은 **"DB에 먼저 기록하고, 이후에 블록체인 트랜잭션을 전송한다"** 는 원칙을 적용하고, 중간에 실패할 경우를 대비해 **롤백(Rollback) 로직**을 추가하는 것입니다.

#### 기존 코드의 문제점

주신 코드는 다음과 같은 순서로 동작합니다.

1.  `caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction)`: **트랜잭션 전송**
2.  `uploader.uploadFile(files)`: 파일 업로드
3.  `swMileageService.createSwMileageAndFiles(...)`: **DB에 데이터 생성**

이 순서는 제가 앞서 설명해 드린 데이터 불일치 문제를 야기할 수 있습니다.

#### 개선된 로직 (수정 방향)

다음과 같은 안전한 순서로 변경하고, 각 단계에 대한 보상 트랜잭션(롤백)을 고려합니다.

1.  **(선택) 파일 업로드**: 파일을 먼저 업로드하고 URL을 확보합니다.
    *   **실패 시**: 즉시 중단하고 에러를 반환합니다.
2.  **DB에 데이터 생성**: 파일 정보를 포함한 마일리지 신청 데이터를 `isConfirmed: 0`, `transaction_hash: null` 상태로 DB에 저장합니다.
    *   **실패 시**: 1단계에서 업로드한 파일이 있다면 삭제하고 에러를 반환합니다.
3.  **블록체인 트랜잭션 전송**: `rawTransaction`을 전송하고 `tx_hash`를 받습니다.
    *   **실패 시**: 2단계에서 생성한 DB 데이터를 삭제하고, 1단계에서 업로드한 파일을 삭제한 후 에러를 반환합니다.
4.  **DB에 `tx_hash` 업데이트**: 2단계에서 생성한 DB 레코드에 3단계에서 받은 `tx_hash`를 업데이트합니다.
5.  **성공**: 모든 과정이 완료되면 성공 응답을 보냅니다.

#### 수정된 코드 예시

위 로직을 `swMileage.controller.js`에 적용하면 다음과 같습니다. 코드의 흐름과 주석에 집중해서 봐주세요.

```javascript
// legacy/src/controllers/swMileage.controller.js

const createSwMileage = catchAsync(async (req, res) => {
  // 1. 기존과 동일하게 사용자 및 입력값 검증을 수행합니다.
  const verifiedPayloadDTO = new VerifiedPayloadDTO({ ...req.verifiedPayload });
  if (verifiedPayloadDTO.role >= constants.ROLE.ADMIN) {
    throw new ApiError(httpStatus.UNAUTHORIZED, `admin can't create swMileage`);
  }

  const student = await studentService.getStudentById(
    verifiedPayloadDTO.studentId
  );
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  // 요청에서 필요한 정보들을 미리 추출합니다.
  const createInfo = {
    ...req.query,
    ...req.params,
    ...req.body,
    ...req.requestData,
  };

  // isConfirmed는 0, transaction_hash는 null로 시작합니다.
  const createSwMileageDTO = new CreateSwMileageDTO({
    ...createInfo,
    isConfirmed: 0,
    transaction_hash: null, 
  });

  const { result: validateStudentInfoResult, message } =
    await swMileageService.validateStudentInformation(
      student,
      createSwMileageDTO
    );
  if (!validateStudentInfoResult) {
    throw new ApiError(httpStatus.BAD_REQUEST, message);
  }

  // 롤백 로직에서 사용하기 위해 변수를 외부 스코프에 선언합니다.
  let swMileageRecord;
  let uploadedFiles;
  
  const { rawTransaction } = createInfo;

  try {
    // --- 작업 순서 변경 ---

    // STEP 1: 파일 업로드 (에러 발생 시 롤백을 위해 업로드 결과 저장)
    const files = req.files;
    uploadedFiles = await uploader.uploadFile(files);
    const fileList = uploadedFiles.map((el) => ({
      name: el.filename,
      url: el.url,
    }));

    // STEP 2: DB에 마일리지 정보 '먼저' 생성
    // createSwMileageDTO에는 아직 transaction_hash가 없습니다.
    const { swMileage, swMileageFiles } =
      await swMileageService.createSwMileageAndFiles(
        createSwMileageDTO,
        fileList
      );
    swMileageRecord = swMileage; // 롤백을 위해 생성된 마일리지 정보 저장

    // STEP 3: 블록체인에 트랜잭션 전송
    // caverService는 성공 시 txHash를 포함한 영수증을 반환한다고 가정합니다.
    const txReceipt = await caverService.sendRawTransactionWithSignAsFeePayer(rawTransaction);
    if (!txReceipt || !txReceipt.transactionHash) {
        // 트랜잭션 해시를 받지 못하면 치명적인 에러로 간주합니다.
        throw new Error("트랜잭션 전송에 실패했거나 트랜잭션 해시를 받아오지 못했습니다.");
    }
    const txHash = txReceipt.transactionHash;

    // STEP 4: 생성된 DB 레코드에 트랜잭션 해시 업데이트
    // 이 작업을 위한 서비스 메소드가 필요합니다. (예: updateSwMileageTxHash)
    await swMileageService.updateSwMileageTxHash(swMileageRecord.id, txHash);

    // STEP 5: 모든 작업 성공 후, 최종 결과를 클라이언트에 반환
    swMileageRecord.transaction_hash = txHash; // 반환값에 txHash 반영
    return res.status(httpStatus.CREATED).json({ swMileage: swMileageRecord, swMileageFiles });

  } catch (error) {
    // --- 롤백(Rollback) 로직 ---
    // 에러 발생 시, 지금까지 성공한 작업을 모두 되돌립니다.

    // 1. DB 레코드가 생성되었다면 삭제합니다.
    if (swMileageRecord && swMileageRecord.id) {
      // 이 작업을 위한 서비스 메소드가 필요합니다. (예: deleteSwMileageAndFiles)
      // 이 메소드는 마일리지와 연관된 파일 레코드까지 모두 삭제해야 합니다.
      await swMileageService.deleteSwMileageAndFiles(swMileageRecord.id);
    }
    
    // 2. 파일이 업로드되었다면 삭제합니다.
    if (uploadedFiles && uploadedFiles.length > 0) {
      // 이 작업을 위한 uploader 메소드가 필요합니다. (예: deleteFiles)
      // S3 등에서 실제 파일들을 삭제해야 합니다.
      await uploader.deleteFiles(uploadedFiles.map(f => f.filename));
    }

    // 최종적으로 에러를 전파하여 클라이언트에게 실패를 알립니다.
    throw new ApiError(error.response?.status || 500, error.message || '마일리지 신청 처리 중 오류가 발생했습니다.');
  }
});
```

#### 주요 변경점 및 참고사항

*   **작업 순서 변경**: `DB 생성` -> `트랜잭션 전송` -> `tx_hash 업데이트` 순으로 명확하게 바뀌었습니다.
*   **롤백(Rollback) 로직 추가**: `try...catch` 구문을 사용하여, 중간에 어느 단계에서 실패하더라도 이전에 성공했던 작업들(파일 업로드, DB 레코드 생성)을 모두 취소하여 데이터 정합성을 유지합니다.
*   **필요한 추가 함수**: 이 로직을 구현하려면 `swMileageService`에 `updateSwMileageTxHash`, `deleteSwMileageAndFiles` 같은 함수가, `uploader`에는 `deleteFiles` 같은 함수가 추가로 필요할 수 있습니다.
*   **원자성(Atomicity)**: 더 높은 수준의 안정성을 위해서는 데이터베이스 트랜잭션을 사용하여 `createSwMileageAndFiles`와 `updateSwMileageTxHash`를 하나의 작업 단위로 묶는 것도 좋은 방법입니다.

이렇게 구현하면 폴링 서버가 이벤트를 아무리 빨리 감지하더라도, DB에는 이미 해당 레코드가 존재하기 때문에 데이터 불일치 문제를 원천적으로 방지할 수 있습니다.

---

### **User:** 모든 api에 저 과정을 추가해야하는건가? 혹시 이 구조를 nestjs에서 구현한다면 어떻게 구현할 수 있을까?

### **AI:** 좋은 질문입니다. 모든 API에 이 과정을 추가해야 하는 것은 아닙니다.

**이 패턴은 데이터베이스와 블록체인에 걸쳐 데이터의 정합성(consistency)이 중요한 모든 API에 적용하는 것이 좋습니다.**

단순히 데이터를 조회하거나(GET), 블록체인과 관련 없는 정보(예: 사용자 프로필 설명)만 수정하는 API에는 이 복잡한 로직이 필요 없습니다.

하지만 **'학생 회원가입', '마일리지 신청', '토큰 전송 요청'** 등과 같이 **"DB에 요청 상태를 먼저 기록하고, 그에 해당하는 블록체인 트랜잭션를 발생시킨 후, 나중에 폴링 서버가 그 결과를 다시 DB에 반영해야 하는"** 모든 비동기적 작업 흐름에는 이 패턴을 반드시 적용해야 데이터 불일치를 막을 수 있습니다.

---

#### NestJS로 안정적인 트랜잭션 처리 구조 구현하기

NestJS는 의존성 주입(DI), 모듈 시스템, 그리고 TypeORM 같은 ORM과의 뛰어난 통합 기능을 제공하여 이런 복잡한 로직을 훨씬 더 체계적이고 깔끔하게 구현할 수 있습니다. `try-catch`로 롤백 로직을 구현하는 기본 아이디어는 같지만, NestJS의 기능을 활용하면 더 구조화된 코드를 작성할 수 있습니다.

`TypeORM`의 **데이터베이스 트랜잭션** 기능을 활용하는 것이 핵심입니다.

##### 1. 구조 설계

*   **Controller:** HTTP 요청을 받고, 유효성을 검사한 후, Service에 작업을 위임합니다. 복잡한 로지은 포함하지 않습니다.
*   **Service:** 실제 비즈니스 로직을 처리합니다. 데이터베이스 트랜잭션, 파일 업로드, 블록체인 트랜잭션 전송 등 핵심적인 작업이 여기서 일어납니다.
*   **Entity:** 데이터베이스 테이블과 매핑되는 TypeORM 엔티티입니다. (`Mileage`, `MileageFile` 등)
*   **DTO (Data Transfer Object):** Controller와 Service 간 데이터 전송에 사용되는 객체입니다.

##### 2. Service에 트랜잭션 로직 구현 (`QueryRunner` 사용)

`TypeORM`의 `QueryRunner`를 사용하면 데이터베이스 트랜잭션을 직접 제어할 수 있어, 블록체인 트랜잭션 같은 외부 API 호출을 포함하는 복잡한 작업 흐름을 안정적으로 처리할 수 있습니다.

아래는 `mileage.service.ts`의 예시입니다.

```typescript
// src/modules/mileage/mileage.service.ts

import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Mileage } from './entities/mileage.entity';
import { MileageFile } from './entities/mileage-file.entity';
import { CreateMileageDto } from './dto/create-mileage.dto';
import { UploaderService } from '../uploader/uploader.service'; // 가상의 파일 업로드 서비스
import { CaverService } from '../caver/caver.service'; // 가상의 블록체인 서비스

@Injectable()
export class MileageService {
  constructor(
    // DataSource를 주입받아 QueryRunner를 생성할 수 있습니다.
    private readonly dataSource: DataSource,
    @InjectRepository(Mileage)
    private readonly mileageRepository: Repository<Mileage>,
    private readonly uploaderService: UploaderService,
    private readonly caverService: CaverService,
  ) {}

  async createMileage(
    createMileageDto: CreateMileageDto,
    files: Express.Multer.File[],
  ): Promise<Mileage> {

    // 1. QueryRunner 생성 및 DB 커넥션 연결
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    
    // 2. 데이터베이스 트랜잭션 시작
    await queryRunner.startTransaction();

    let uploadedFileResults = [];

    try {
      // STEP 1: 파일 업로드 (DB 트랜잭션 외부에서 먼저 처리)
      // 실패 시, 아래 catch 블록에서 롤백 없이 바로 에러를 던집니다.
      if (files && files.length > 0) {
        uploadedFileResults = await this.uploaderService.uploadFiles(files);
      }
      
      // STEP 2: DB에 마일리지 정보 '먼저' 생성
      // 이 시점에는 transactionHash가 null 입니다.
      const newMileage = this.mileageRepository.create({
        ...createMileageDto,
        isConfirmed: false, // 혹은 'PENDING' 상태
        transactionHash: null,
      });

      // QueryRunner의 manager를 사용해야 같은 트랜잭션으로 묶입니다.
      const savedMileage = await queryRunner.manager.save(newMileage);

      // 파일 정보도 DB에 저장합니다.
      if (uploadedFileResults.length > 0) {
        const fileEntities = uploadedFileResults.map(file => 
          queryRunner.manager.create(MileageFile, {
            mileage: savedMileage,
            name: file.filename,
            url: file.url,
          })
        );
        await queryRunner.manager.save(fileEntities);
      }
      
      // STEP 3: 블록체인에 트랜잭션 전송
      const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
      if (!txReceipt || !txReceipt.transactionHash) {
        throw new InternalServerErrorException('트랜잭션 전송 실패 또는 해시를 받아오지 못했습니다.');
      }
      const txHash = txReceipt.transactionHash;

      // STEP 4: 생성된 DB 레코드에 트랜잭션 해시 업데이트
      await queryRunner.manager.update(Mileage, savedMileage.id, {
        transactionHash: txHash,
      });
      
      // STEP 5: 모든 작업이 성공하면 트랜잭션을 커밋합니다.
      await queryRunner.commitTransaction();

      savedMileage.transactionHash = txHash;
      return savedMileage;

    } catch (error) {
      // --- 롤백(Rollback) 로직 ---
      // STEP 6: 에러 발생 시, 모든 DB 작업을 되돌립니다.
      await queryRunner.rollbackTransaction();

      // DB 트랜잭션 롤백 후, 먼저 업로드했던 파일을 삭제합니다.
      if (uploadedFileResults.length > 0) {
        await this.uploaderService.deleteFiles(uploadedFileResults.map(f => f.filename));
      }
      
      // 에러를 상위로 전파합니다.
      throw new InternalServerErrorException(
        error.message || '마일리지 신청 처리 중 오류가 발생했습니다.',
      );
    } finally {
      // STEP 7: 성공하든 실패하든, QueryRunner를 해제하여 커넥션을 반납합니다.
      await queryRunner.release();
    }
  }
}
```

##### 3. Controller 구현

Controller는 매우 단순해집니다. Service를 호출하고 결과를 반환하기만 하면 됩니다. 에러 처리는 NestJS의 Exception Filter가 알아서 처리해 줄 것입니다.

```typescript
// src/modules/mileage/mileage.controller.ts

import { Controller, Post, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MileageService } from './mileage.service';
import { CreateMileageDto } from './dto/create-mileage.dto';

@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files')) // 'files'는 form-data의 key
  async create(
    @Body() createMileageDto: CreateMileageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // 복잡한 로직 없이 서비스 메소드 호출 하나로 끝납니다.
    return this.mileageService.createMileage(createMileageDto, files);
  }
}
```

#### NestJS 구현의 장점

1.  **데이터 정합성 보장**: `TypeORM`의 트랜잭션 기능으로 DB 작업의 원자성을 보장하여, 중간에 실패하더라도 DB 상태가 오염되지 않습니다.
2.  **관심사의 분리(SoC)**: Controller는 HTTP 요청 처리에만, Service는 비즈니스 로직에만 집중하여 코드가 명확해지고 유지보수가 쉬워집니다.
3.  **테스트 용이성**: 의존성 주입 덕분에 각 Service를 독립적으로 모킹(mocking)하여 단위 테스트를 작성하기가 매우 편리합니다.
4.  **코드 재사용성**: `UploaderService`, `CaverService` 등 공통 기능을 모듈화하여 다른 비즈니스 로직에서도 쉽게 재사용할 수 있습니다.

---

### **User:** 이러면 I/O 횟수가 너무 많아지지 않아??

### **AI:** 네, 정말 예리하고 중요한 지적이십니다.

결론부터 말씀드리면, **네, I/O 횟수가 늘어나는 것은 맞습니다. 하지만 그로 인한 성능 저하보다, 데이터 정합성을 보장함으로써 얻는 안정성의 이점이 압도적으로 큽니다.**

이 문제를 두 가지 관점에서 설명해 드릴 수 있습니다.

#### 1. 속도의 관점: 병목은 데이터베이스가 아닙니다.

API 요청 하나의 전체 처리 시간에서 각 단계가 차지하는 비중을 생각해 보겠습니다.

*   **기존 방식 (불안정):**
    1.  `블록체인 트랜잭션 전송`: **수백 ms ~ 수 초 (가장 느림)**
    2.  `파일 업로드`: 수십 ~ 수백 ms
    3.  `DB 데이터 생성 (INSERT 2번)`: **수 ms**

*   **개선된 방식 (안정적):**
    1.  `파일 업로드`: 수십 ~ 수백 ms
    2.  `DB 트랜잭션 시작`: **~1 ms**
    3.  `DB 데이터 생성 (INSERT 2번)`: **수 ms**
    4.  `블록체인 트랜잭션 전송`: **수백 ms ~ 수 초 (여전히 가장 느림)**
    5.  `DB 데이터 업데이트 (UPDATE 1번)**: **~1 ms**
    6.  `DB 트랜잭션 커밋**: **~1 ms**

보시다시피, 늘어난 I/O는 모두 밀리초(ms) 단위로 처리되는 매우 빠른 데이터베이스 작업입니다. 반면, 이 API의 전체 실행 시간을 좌우하는 **진짜 병목 구간은 블록체인 노드와 통신하여 트랜잭션을 전송하는 부분**입니다.

따라서 데이터베이스 I/O가 몇 번 더 추가된다고 해도, 사용자가 체감하는 API의 전체 응답 시간에는 거의 영향을 주지 않습니다. 이는 전체 여행 시간에서 가장 오래 걸리는 비행시간(블록체인)은 그대로인데, 공항 내에서 카트를 빌리는 시간(DB)이 1초 늘어나는 것을 걱정하는 것과 같습니다.

#### 2. 안정성의 관점: I/O 증가는 안정성을 위한 '보험료'입니다.

늘어난 I/O는 시스템의 안정성과 데이터 정합성을 보장하기 위한 비용, 즉 '보험료'라고 생각하시면 정확합니다.

*   **보험료를 내지 않았을 때 (기존 방식):** 평소에는 문제가 없어 보이지만, 재수 없게 레이스 컨디션이 발생하는 순간(사고 발생 시), 데이터가 완전히 꼬여버립니다. 블록체인에는 기록되었는데 우리 DB에는 없거나, 상태가 업데이트되지 않는 등 복구하기 매우 어려운 상황이 발생합니다. 이 문제를 해결하기 위해 개발자가 직접 데이터를 수정하고 원인을 분석하는 비용이 훨씬 더 큽니다.

*   **보험료를 냈을 때 (개선된 방식):** 약간의 추가 비용(추가 I/O)으로 '어떤 상황에서도 데이터는 절대 꼬이지 않는다'는 것을 보장받습니다. `try-catch`와 데이터베이스 트랜잭션이 실패한 모든 케이스를 알아서 처리하고 시스템 상태를 깨끗하게 유지해 줍니다.

#### 요약

| 항목 | I/O 횟수 | 성능 | 안정성 및 데이터 정합성 | 유지보수 비용 |
| :--- | :--- | :--- | :--- | :--- |
| **기존 방식** | 적음 | 미세하게 빠름 | **매우 취약** | 높음 (사고 발생 시) |
| **개선된 방식** | 많음 | 미세하게 느림 | **매우 견고** | 낮음 (예측 가능) |

결론적으로, **늘어나는 I/O 횟수는 무시할 수 있을 정도로 사소한 비용**이며, 이를 통해 얻는 **시스템 전체의 안정성과 예측 가능성**이라는 이점은 비교할 수 없을 정도로 중요합니다. 이는 NestJS뿐만 아니라 모든 백엔드 프레임워크에서 외부 시스템과 연동하여 데이터를 처리할 때 사용하는 표준적인 모범 사례(Best Practice)입니다.

---

### **User:** 그럼 저 구조를 모듈화 하면 어떻게 할 수 있을까? 예를 들어 트랜잭션을 전송하기 전 수행해야 하는 작업은 비즈니스 로직이기에 각 서비스 레이어에서 구현하고, 트랜잭션을 전송하고 tx_hash나 추가 상태 업데이트과정을 모듈화한다면?@/src 하위의 코드들은 내가 현재 구현중인 nestjs 프로젝트인데 이 구조를 참조하여 구조와 적합한 방법을 제안해줘

### **AI:** 네, 매우 훌륭하고 실용적인 아이디어입니다. 말씀하신 대로, 반복되는 안정성 처리 로직(DB 트랜잭션, 블록체인 전송, 롤백)을 **중앙에서 관리하는 공유 모듈**로 만들고, 각 비즈니스 서비스는 실제 비즈니스 로직에만 집중하게 하는 것이 NestJS의 설계 철학과 완벽하게 부합합니다.

현재 `src` 구조를 기반으로 이 아이디어를 구현하는 가장 효율적이고 확장 가능한 방법을 제안해 드리겠습니다. 핵심은 **`@/shared` 디렉터리에 재사용 가능한 `TransactionHandlerModule`을 만드는 것**입니다.

---

#### 제안 구조: `TransactionHandlerModule`

이 모듈은 "템플릿 메소드 패턴(Template Method Pattern)"과 유사한 방식으로 동작합니다. 핵심적인 처리 흐름(DB 트랜잭션 시작, 커밋, 롤백, 롤백 시 파일 삭제 등)은 `TransactionHandlerService`가 담당하고, 각 API에서 달라지는 세부적인 비즈니스 로직은 `MileageService` 같은 곳에서 구현하여 `TransactionHandlerService`에 콜백(callback) 함수 형태로 주입하는 방식입니다.

##### STEP 1: 재사용 가능한 `TransactionHandler` 모듈 생성

먼저, 이 공통 로직을 담을 모듈을 `@/src/shared`에 만듭니다.

**파일 구조:**
```
src/
├── modules/
│   ├── mileage/
│   │   ├── mileage.service.ts  // (수정될 파일)
│   │   └── mileage.module.ts   // (수정될 파일)
│   └── ...
└── shared/
    └── transaction-handler/
        ├── transaction-handler.service.ts  // (새로 생성될 핵심 서비스)
        ├── transaction-handler.module.ts   // (새로 생성될 모듈)
        └── interfaces/                     // (인터페이스 정의)
            └── transaction-callbacks.interface.ts 
```

**1. 인터페이스 정의 (`transaction-callbacks.interface.ts`)**

서비스에 전달할 콜백 함수의 구조를 명확하게 정의합니다.

```typescript
// src/shared/transaction-handler/interfaces/transaction-callbacks.interface.ts
import { EntityManager } from 'typeorm';

// 비즈니스 로직 실행 결과를 담을 인터페이스
export interface BusinessLogicResult<T> {
  entity: T; // DB에 저장된 주요 엔티티
  rawTransaction: string; // 블록체인에 전송할 raw transaction
}

// TransactionHandlerService에 전달할 콜백 객체
export interface TransactionCallbacks<T> {
  // 1. DB 트랜잭션 내에서 실행될 비즈니스 로직 (예: 마일리지 레코드 생성)
  businessLogic: (manager: EntityManager) => Promise<BusinessLogicResult<T>>;

  // 2. 블록체인 트랜잭션을 전송하는 로직
  blockchainLogic: (data: BusinessLogicResult<T>) => Promise<string>; // txHash 반환

  // (선택) 파일 업로드 로직
  uploadLogic?: () => Promise<any[]>;

  // (선택) 실패 시 파일 롤백 로직
  cleanupOnFailure?: (uploadedFiles: any[]) => Promise<void>;
}
```

**2. 핵심 로직 서비스 구현 (`transaction-handler.service.ts`)**

이 서비스가 바로 말씀하신 "모듈화된 부분"입니다.

```typescript
// src/shared/transaction-handler/transaction-handler.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { BusinessLogicResult, TransactionCallbacks } from './interfaces/transaction-callbacks.interface.ts';

@Injectable()
export class TransactionHandlerService {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T extends { id: any }> (
    callbacks: TransactionCallbacks<T>,
  ): Promise<T> {
    const { 
      businessLogic, 
      blockchainLogic, 
      uploadLogic, 
      cleanupOnFailure 
    } = callbacks;

    let uploadedFiles = [];

    // 파일 업로드는 DB 트랜잭션과 무관하므로 먼저 실행
    if (uploadLogic) {
      try {
        uploadedFiles = await uploadLogic();
      } catch (uploadError) {
        throw new InternalServerErrorException(`파일 업로드 실패: ${uploadError.message}`);
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. DB 트랜잭션 내에서 비즈니스 로직 실행
      const { entity, rawTransaction } = await businessLogic(queryRunner.manager);

      // 2. 블록체인 트랜잭션 전송
      const txHash = await blockchainLogic({ entity, rawTransaction });
      if (!txHash) {
        throw new Error('블록체인 트랜잭션 해시를 받아오지 못했습니다.');
      }

      // 3. txHash를 해당 엔티티에 업데이트
      await queryRunner.manager.update(entity.constructor.name, entity.id, {
        transactionHash: txHash,
      });

      // 4. DB 트랜잭션 커밋
      await queryRunner.commitTransaction();
      
      // 성공한 엔티티 반환
      (entity as any).transactionHash = txHash;
      return entity;

    } catch (error) {
      // 5. 에러 발생 시 DB 롤백
      await queryRunner.rollbackTransaction();

      // 파일이 업로드 되었다면, 파일도 롤백(삭제)
      if (cleanupOnFailure && uploadedFiles.length > 0) {
        await cleanupOnFailure(uploadedFiles);
      }

      throw new InternalServerErrorException(`처리 실패: ${error.message}`);
    } finally {
      // 6. 커넥션 해제
      await queryRunner.release();
    }
  }
}
```

**3. 모듈 정의 (`transaction-handler.module.ts`)**

서비스를 모듈로 묶고 다른 모듈에서 사용할 수 있도록 `exports` 합니다.

```typescript
// src/shared/transaction-handler/transaction-handler.module.ts
import { Module, Global } from '@nestjs/common';
import { TransactionHandlerService } from './transaction-handler.service';

@Global() // 전역 모듈로 만들어 어느 모듈에서나 바로 주입 가능하게 함
@Module({
  providers: [TransactionHandlerService],
  exports: [TransactionHandlerService],
})
export class TransactionHandlerModule {}
```

##### STEP 2: `AppModule`에 `TransactionHandlerModule` 등록

`@Global()` 데코레이터를 사용했기 때문에 `app.module.ts`에 한번만 등록해주면 모든 곳에서 `TransactionHandlerService`를 주입받을 수 있습니다.

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { Modules } from './modules';
// TransactionHandlerModule을 import 합니다.
import { TransactionHandlerModule } from './shared/transaction-handler/transaction-handler.module';

@Module({
  imports: [
    ConfigModule, 
    ...Modules,
    TransactionHandlerModule, // 여기에 추가
  ],
})
export class AppModule {}
```

##### STEP 3: 비즈니스 로직 리팩토링 (`MileageService`)

이제 `MileageService`는 복잡한 `try-catch`나 `QueryRunner` 관리 없이, 오직 **"무엇을 할 것인가"** 에만 집중할 수 있습니다.

```typescript
// src/modules/mileage/mileage.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Mileage } from './entities/mileage.entity';
import { CreateMileageDto } from './dto/create-mileage.dto';
import { UploaderService } from '../uploader/uploader.service';
import { CaverService } from '../caver/caver.service';
// 공통 서비스 및 인터페이스 import
import { TransactionHandlerService } from '@/shared/transaction-handler/transaction-handler.service';
import { BusinessLogicResult } from '@/shared/transaction-handler/interfaces/transaction-callbacks.interface';

@Injectable()
export class MileageService {
  constructor(
    @InjectRepository(Mileage)
    private readonly mileageRepository: Repository<Mileage>,
    private readonly uploaderService: UploaderService,
    private readonly caverService: CaverService,
    // 핵심: TransactionHandlerService를 주입받습니다.
    private readonly transactionHandler: TransactionHandlerService,
  ) {}

  async createMileage(
    createMileageDto: CreateMileageDto,
    files: Express.Multer.File[],
  ): Promise<Mileage> {
    
    // transactionHandler.execute를 호출하여 로직을 실행합니다.
    return this.transactionHandler.execute<Mileage>({
      // 1. 파일 업로드 로직 정의
      uploadLogic: async () => {
        return this.uploaderService.uploadFiles(files);
      },

      // 2. DB 작업 로직 정의
      businessLogic: async (manager: EntityManager): Promise<BusinessLogicResult<Mileage>> => {
        const newMileage = manager.create(Mileage, {
          ...createMileageDto,
          isConfirmed: false,
          transactionHash: null,
        });
        const savedMileage = await manager.save(newMileage);
        
        // 파일 정보도 같은 트랜잭션 내에서 저장 가능
        // ... manager.save(fileEntities) ...

        return {
          entity: savedMileage,
          rawTransaction: createMileageDto.rawTransaction,
        };
      },

      // 3. 블록체인 전송 로직 정의
      blockchainLogic: async (data) => {
        const txReceipt = await this.caverService.sendRawTransaction(data.rawTransaction);
        return txReceipt.transactionHash; // txHash만 반환
      },
      
      // 4. 실패 시 파일 정리 로직 정의
      cleanupOnFailure: async (uploadedFiles) => {
        const filenames = uploadedFiles.map(f => f.filename);
        await this.uploaderService.deleteFiles(filenames);
      },
    });
  }
}
```

#### 이 구조의 장점

1.  **완벽한 관심사 분리(SoC):** `MileageService`는 '마일리지 생성'이라는 순수 비즈니스 로직에만 집중하고, `TransactionHandlerService`는 '안정적인 분산 트랜잭션 처리'라는 기술적인 문제에만 집중합니다.
2.  **엄청난 재사용성:** '학생 회원가입', '토큰 전송' 등 유사한 패턴을 가진 다른 어떤 서비스에서도 `TransactionHandlerService`를 그대로 주입하여 사용할 수 있습니다.
3.  **유지보수 용이성:** 분산 트랜잭션 처리 로직에 버그가 있거나 정책이 변경될 경우, `TransactionHandlerService` 단 한 곳만 수정하면 이를 사용하는 모든 서비스에 일괄적으로 적용됩니다.
4.  **가독성 향상:** `MileageService`의 코드가 훨씬 간결해지고 비즈니스 흐름을 파악하기 쉬워집니다.

---

### **User:** `queryRunner.startTransaction()` 이 부분을 사용하면 함수가 종료되지 않아도 데이터베이스에 이미 정보를 저장하는거야?

### **AI:** 아니요, 그렇지 않습니다. **정반대입니다.**

`await queryRunner.startTransaction();` 이 코드는 데이터베이스에 "지금부터 내가 하는 모든 작업들은 하나의 묶음(트랜잭션)이야. 내가 최종적으로 승인('커밋')하기 전까지는 **절대 영구적으로 저장하지 마**" 라고 선언하는 것과 같습니다.

이것이 바로 데이터베이스 트랜잭션의 핵심 개념이며, 데이터 정합성을 보장하는 가장 중요한 기능입니다.

더 자세히 설명해 드리겠습니다.

#### 데이터베이스 트랜잭션의 동작 (은행 계좌 이체 예시)

A 계좌에서 B 계좌로 10,000원을 이체하는 상황을 생각해 보겠습니다.

1.  `queryRunner.startTransaction();`
    *   **은행:** "계좌 이체 작업을 시작하겠습니다. 지금부터의 모든 과정은 성공하거나, 아예 없었던 일이 되거나 둘 중 하나입니다."
    *   데이터베이스는 이 트랜잭션만을 위한 격리된 작업 공간을 메모리 등에 마련합니다.

2.  `manager.update('A계좌', { 잔액: 기존잔액 - 10000 });`
    *   **은행:** "A 계좌에서 10,000원을 차감합니다."
    *   이 변경사항은 **격리된 임시 작업 공간에만 기록됩니다.** 아직 실제 데이터베이스 파일에 영구적으로 저장되지 않습니다. 이 시점에 다른 사람이 A 계좌 잔액을 조회하면, 아직 10,000원이 차감되기 전의 금액이 보입니다.

3.  `manager.update('B계좌', { 잔액: 기존잔액 + 10000 });`
    *   **은행:** "B 계좌에 10,000원을 입금합니다."
    *   이 변경사항 역시 **격리된 임시 작업 공간에만 기록됩니다.**

4.  **성공 시: `queryRunner.commitTransaction();`**
    *   **은행:** "모든 과정이 성공적으로 끝났으니, 이 변경사항들을 확정합니다."
    *   **바로 이 시점에**, 임시 작업 공간에 있던 모든 변경사항(A계좌 차감, B계좌 입금)이 실제 데이터베이스 파일에 **영구적으로 한 번에 기록(저장)됩니다.** 이 순간부터 모든 사람이 변경된 잔액을 볼 수 있습니다.

5.  **실패 시: `queryRunner.rollbackTransaction();`**
    *   만약 2번과 3번 사이에서 어떤 에러(예: B계좌 없음)가 발생하면 `catch` 블록이 실행됩니다.
    *   **은행:** "문제가 발생했으니, 이체 작업 전체를 취소합니다."
    *   임시 작업 공간에 기록되었던 모든 변경사항(**A계좌에서 10,000원을 차감했던 기록까지 포함하여**)이 **깨끗하게 폐기됩니다.** 데이터베이스는 `startTransaction()` 이전의 상태로 완벽하게 돌아갑니다.

#### 결론

`queryRunner.startTransaction()`를 호출하면, 그 이후에 실행되는 모든 데이터베이스 작업(저장, 수정, 삭제)은 **함수가 성공적으로 끝나서 `commitTransaction()`이 호출되기 전까지는 절대 영구적으로 저장되지 않습니다.**

따라서 이 구조는 중간에 어떤 에러가 발생하더라도 데이터베이스가 '더러워지는' 것을 막아주는 매우 안전하고 강력한 보호 장치입니다. 함수가 완전히 성공해야만 데이터가 저장되는 것을 보장해 줍니다.

---

### **User:** 그럼 너가 보여준 예시에서 트랜잭션 처리, 데이터 저장 과정에서 queryRunner를 사용하는 이유가 뭐야? 동작 방식을 하나하나 설명해줄래?

### **AI:** 네, 아주 좋은 질문입니다. 이 부분이 `TransactionHandlerService`의 핵심 동작 원리이므로 정확히 이해하는 것이 중요합니다.

`QueryRunner`를 사용하는 이유는 단 하나입니다. 바로 **데이터베이스 트랜잭션의 생명주기(시작, 커밋, 롤백)를 직접 제어하여, 데이터베이스 작업과 블록체인 전송 같은 외부 시스템 호출을 하나의 원자적(atomic) 단위로 묶기 위함**입니다.

간단히 말해, **"모든 과정이 성공해야만 최종 저장하고, 하나라도 실패하면 모든 것을 없었던 일로 되돌리기 위해"** `QueryRunner`를 사용하는 것입니다.

`TransactionHandlerService`의 `execute` 메소드가 동작하는 방식을 단계별로 설명해 드리겠습니다.

#### `QueryRunner`의 동작 방식 Step-by-Step

온라인 쇼핑몰에서 "장바구니에 물건 담기 -> 결제 시도 -> 최종 주문 완료" 과정에 비유해서 설명하겠습니다.

---

##### `try` 블록 (성공 시나리오)

**1. `const queryRunner = this.dataSource.createQueryRunner();`**
*   **동작:** TypeORM의 커넥션 풀에서 데이터베이스와 통신할 수 있는 전용 통로(커넥션)를 하나 빌려옵니다.
*   **비유:** 쇼핑을 위해 나만의 **'장바구니'**를 하나 만드는 것과 같습니다.

**2. `await queryRunner.connect();`**
*   **동작:** 빌려온 통로를 실제로 연결하여 DB와 통신할 준비를 마칩니다.
*   **비유:** '장바구니'를 들고 쇼핑을 시작할 준비를 합니다.

**3. `await queryRunner.startTransaction();`**
*   **동작:** **가장 중요한 단계입니다.** 데이터베이스에게 "지금부터 내가 요청하는 DB 작업(INSERT, UPDATE, DELETE)은 최종 승인 전까지는 임시로만 기록하고, 실제 저장(commit)은 하지 마세요" 라고 명령합니다. 데이터베이스는 이 트랜잭션만을 위한 격리된 작업 공간을 만듭니다.
*   **비유:** "지금부터 장바구니에 담는 물건들은 **'구매 후보'** 입니다. 내가 최종 '결제하기' 버튼을 누르기 전까지는 내 소유가 아닙니다."

**4. `await businessLogic(queryRunner.manager);`**
*   **동작:** `MileageService`에서 전달한 DB 작업 로직이 실행됩니다. 여기서 핵심은 `this.mileageRepository`가 아니라 **`queryRunner.manager`**를 사용한다는 점입니다. 이 `manager`는 3번 단계에서 시작된 트랜잭션의 격리된 공간 안에서만 동작합니다.
    *   `manager.create(...)` : 마일리지 엔티티 객체를 만듭니다.
    *   `manager.save(...)` : 만들어진 객체를 **트랜잭션의 임시 작업 공간에 저장합니다.** 아직 실제 DB 테이블에 영구 저장된 것이 아닙니다.
*   **비유:** 마일리지라는 물건을 장바구니에 담습니다. 물건은 장바구니 안에 있지만, 아직 결제하지 않았습니다.

**5. `await blockchainLogic(...)`**
*   **동작:** 이제 데이터베이스와는 상관없는 외부 작업, 즉 블록체인으로 `rawTransaction`을 전송합니다. 이 작업은 성공할 수도, 실패할 수도 있는 위험한 구간입니다.
*   **비유:** 장바구니에 물건을 담아둔 채로, 결제를 위해 카드사에 **"카드 한도 조회를 요청"**합니다. 이 조회는 성공할 수도, 실패할 수도 있습니다.

**6. `await queryRunner.manager.update(...)`**
*   **동작:** 5번 단계가 성공하면, 반환받은 `txHash`를 4번에서 임시 저장했던 마일리지 레코드에 업데이트합니다. 이 작업 역시 **트랜잭션의 임시 작업 공간**에서 일어납니다.
*   **비유:** 카드 한도 조회가 성공했으므로, 주문서에 '카드 결제 예정'이라고 메모를 추가합니다.

**7. `await queryRunner.commitTransaction();`**
*   **동작:** `commit`(커밋) 명령을 보냅니다. 데이터베이스는 "알겠습니다. 이 트랜잭션 동안 임시 작업 공간에 기록했던 모든 변경사항(마일리지 생성, txHash 업데이트 등)을 **이제 실제 테이블에 영구적으로 저장하겠습니다**" 라고 응답하며 모든 변경사항을 한 번에 적용합니다.
*   **비유:** **최종 '결제하기' 버튼을 누릅니다.** 장바구니에 있던 모든 물건이 내 소유로 확정되고, 주문이 완료됩니다.

---

##### `catch` 및 `finally` 블록 (실패 시나리오)

**8. `catch (error)` 블록 진입**
*   **동작:** 만약 4, 5, 6번 단계 중 어디서든 에러가 발생하면(예: 블록체인 노드 응답 없음), 즉시 `catch` 블록으로 이동합니다.

**9. `await queryRunner.rollbackTransaction();`**
*   **동작:** `rollback`(롤백) 명령을 보냅니다. 데이터베이스는 "알겠습니다. 이 트랜잭션 동안 임시 작업 공간에 기록했던 모든 변경사항을 **깨끗하게 전부 폐기하겠습니다**" 라고 응답합니다. `startTransaction()` 이전 상태로 완벽하게 되돌아갑니다.
*   **비유:** 카드 한도 부족으로 결제가 실패했습니다. 장바구니에 담았던 모든 물건을 비우고 **쇼핑을 시작하기 전 상태로 되돌립니다.**

**10. `finally { await queryRunner.release(); }`**
*   **동작:** `try`가 성공하든, `catch`가 실행되든 상관없이 **무조건 마지막에 실행**됩니다. 1번에서 빌려왔던 전용 통로(커넥션)를 다시 커넥션 풀에 반납하여 다른 요청이 사용할 수 있도록 합니다. 이를 통해 DB 커넥션 자원이 낭비되는 것을 막습니다.
*   **비유:** 쇼핑이 성공적으로 끝났든, 실패하고 그냥 나왔든, 어쨌든 **사용했던 '장바구니'는 원래 있던 곳에 반납**합니다.

#### 결론

`QueryRunner`는 이처럼 복잡하고 실패 가능성이 있는 여러 단계를 **'하나의 성공' 또는 '하나의 실패'로 묶어 데이터의 정합성을 완벽하게 보장**하기 위해 사용하는 강력하고 필수적인 도구입니다.

---

### **User:** 그럼 이 과정이 어떻게 이벤트 서버의 데이터 I/O와 앱 서버의 데이터 I/O 순서를 보장해줄 수 있는거야?

### **AI:** 네, 바로 그 부분이 이 아키텍처의 핵심입니다. 이 구조가 어떻게 앱 서버와 폴링(이벤트) 서버 간의 데이터 I/O 순서를 보장하는지 명확하게 설명해 드리겠습니다.

결론부터 말씀드리면, **앱 서버의 DB 작업이 '선행 조건'이 되도록 강제하여, 폴링 서버가 작업을 시도할 때 반드시 필요한 데이터가 준비되어 있도록 보장**하는 방식입니다.

두 서버의 타임라인을 비교하며 살펴보겠습니다.

---

#### **Before: 불안정한 구조 (레이스 컨디션 발생 가능)**

기존 구조에서는 두 서버의 DB 작업이 독립적으로 실행되어 순서가 꼬일 수 있었습니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 | 문제점 |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. 블록체인에 트랜잭션 전송** | | `(아무것도 없음)` | |
| **T=0.1s** | 2. (DB 저장 로직 실행 대기 중...) | | `(아무것도 없음)` | DB 부하 등으로 지연 발생 |
| **T=1.0s** | | **1. 블록체인에서 이벤트 감지 (txHash 포함)** | `(아무것도 없음)` | |
| **T=1.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | `(아무것도 없음)` | **조회 실패!** 업데이트할 레코드가 없음 |
| **T=1.2s** | | 3. (작업 종료) | `(아무것도 없음)` | |
| **T=2.0s** | 3. **DB에 데이터 생성 (`isConfirmed: 0`)** | | `mileage (id:1, isConfirmed:0)` | **영원히 `isConfirmed:0`으로 남음** |

**문제의 근본 원인:** 폴링 서버가 DB에 접근하는 **T=1.1s** 시점에, 앱 서버가 만들어야 할 데이터가 아직 존재하지 않는다는 것입니다.

---

#### **After: `TransactionHandler`를 사용한 안정적인 구조**

개선된 구조에서는 앱 서버의 작업 흐름이 변경되어 이 문제를 원천적으로 차단합니다. `commit`이 일어나는 시점이 매우 중요합니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 (임시 작업 공간) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. DB 트랜잭션 시작** | | | `(아무것도 없음)` |
| **T=0.1s** | **2. DB에 데이터 생성 (txHash=null)** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.0s** | **3. 블록체인에 트랜잭션 전송** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.1s** | **4. txHash를 DB에 업데이트** | | `mileage (id:1, txHash:'0x123...')` | `(아무것도 없음)` |
| **T=1.2s** | **5. DB 트랜잭션 커밋(commit)** | | `(모든 변경사항 폐기)` | **`mileage (id:1, txHash:'0x123...')`** |
| **T=2.0s** | | **1. 블록체인에서 이벤트 감지 (txHash:'0x123...' 포함)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.2s** | | **3. 조회 성공! `isConfirmed=true`로 업데이트** | | **`mileage (id:1, isConfirmed:true)`** |

#### 순서가 보장되는 이유

1.  **폴링 서버의 작업 트리거는 '이벤트'입니다.** 그리고 블록체인 이벤트에는 **`txHash`**가 포함됩니다. 즉, 폴링 서버는 특정 `txHash`를 가진 이벤트를 받아야만 동작을 시작합니다.

2.  **`txHash`는 앱 서버가 블록체인에 트랜잭션을 성공적으로 전송해야만 얻을 수 있습니다.** (`T=1.0s` 이후)

3.  **앱 서버는 `txHash`를 얻은 후, 그 `txHash`를 포함한 모든 정보를 데이터베이스에 `commit`합니다.** (`T=1.2s`) `commit`이 완료된 후에야 비로소 이 데이터는 다른 프로세스(폴링 서버 등)에서 조회가 가능해집니다.

4.  따라서, 폴링 서버가 이벤트를 통해 `txHash`를 알게 되는 시점(**T=2.0s**)은 **논리적으로 항상** 앱 서버가 해당 `txHash`를 포함한 레코드를 DB에 영구적으로 저장(`commit`)한 시점(**T=1.2s**)보다 **늦을 수밖에 없습니다.**

아무리 폴링 서버가 빠르고, 앱 서버의 `commit` 이후 로직이 느리더라도, 폴링 서버가 작업을 시작하는 데 필요한 '재료'(`txHash`가 저장된 DB 레코드)는 앱 서버의 `commit` 시점에 이미 완벽하게 준비되어 있는 것입니다.

결론적으로, **"폴링 서버의 작업 시작 조건(이벤트 발생)이 앱 서버의 작업 완료 조건(DB 커밋) 이후에 형성되도록"** 프로세스를 설계했기 때문에 두 서버 간의 I/O 순서가 완벽하게 보장됩니다.

---

### **User:** 이해가 안가는게, 1.0에서 트랜잭션을 전송하고 이 순간 부하가 일어나서 1.1부터의 과정이 진행되지 않는다면 2.0에 진행되는 이벤트 감지가 벌어지는 건 똑같은거 아니야? 여기서 말하는 트랜잭션 전송은 예를 들어 Kairos 테스트넷의 rpc url로 raw transaction을 전송하는거야. 내가 부가설명을 안했을 수도 있는데 폴링 서버와 앱서버는 서로 다른 포트를 사용하는 독립적인 서버라고 생각하면 돼

### **AI:** 네, 맞습니다. 그 지점이 바로 이 설계에서 가장 혼동하기 쉬운 부분이면서 동시에 가장 중요한 부분입니다. 질문해주셔서 감사합니다.

결론부터 말씀드리면, **네, 그 상황은 똑같이 발생할 수 있습니다. 하지만 `commit`을 하지 않았기 때문에 폴링 서버는 아무것도 할 수가 없습니다.** 이것이 핵심입니다.

앱 서버와 폴링 서버가 독립적인 서버라는 점을 정확히 인지하고 다시 설명해 드리겠습니다.

#### 가정된 문제 상황 (질문하신 시나리오)

| 시간 | 앱 서버 (API:3000) | 블록체인 (Kairos RPC) | 폴링 서버 (API:8080) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | 1. DB 트랜잭션 시작 | | | `(아무것도 없음)` |
| **T=0.1s** | 2. `Mileage` 레코드 임시 생성 | | | `(아무것도 없음)` |
| **T=1.0s** | 3. **Kairos RPC로 `rawTransaction` 전송** | 트랜잭션 수신 및 처리 시작 | | `(아무것도 없음)` |
| **T=1.1s** | **(앱 서버에 치명적인 부하 발생! 다음 코드 진행 불가)** | | | `(아무것도 없음)` |
| **T=2.0s** | (앱 서버 여전히 멈춰있음) | **트랜잭션 처리 완료 -> 이벤트 발생** | | `(아무것도 없음)` |
| **T=2.1s** | (앱 서버 여전히 멈춰있음) | | **1. 이벤트 감지 (txHash: '0x123...' 획득)** | `(아무것도 없음)` |
| **T=2.2s** | (앱 서버 여전히 멈춰있음) | | **2. `txHash='0x123...'`인 레코드를 DB에서 조회** | **`(아무것도 없음)`** |
| **T=2.3s** | (앱 서버 여전히 멈춰있음) | | **3. 조회 결과: 없음. `null` 반환.** | `(아무것도 없음)` |
| **T=2.4s** | (앱 서버 여전히 멈춰있음) | | **4. 할 일이 없으므로 작업 종료 또는 재시도 로직 대기** | `(아무것도 없음)` |

#### 왜 문제가 해결되는가? - "Commit의 힘"

위 시나리오에서 가장 중요한 것은 **T=2.2초**에 폴링 서버가 DB를 조회했을 때의 결과입니다.

*   **앱 서버의 상태:** 앱 서버는 **T=1.0초**에 트랜잭션을 쏘고 나서 멈췄습니다. 그래서 `txHash`를 받아오는 로직, `txHash`를 업데이트하는 로직, 그리고 가장 중요한 **`queryRunner.commitTransaction()`**을 **실행하지 못했습니다.**

*   **DB의 상태:** 데이터베이스의 관점에서 보면, 앱 서버는 트랜잭션을 시작(`startTransaction`)했지만, 최종 승인(`commit`)도, 취소(`rollback`)도 하지 않은 어정쩡한 상태로 연결이 끊겨버린 것입니다. 대부분의 데이터베이스 시스템(PostgreSQL, MySQL 등)은 이런 경우, 해당 트랜잭션을 **자동으로 롤백(Rollback)** 처리하여 트랜잭션 시작 전의 상태로 되돌립니다. 즉, **T=0.1초**에 임시로 만들었던 `Mileage` 레코드는 그냥 사라집니다.

*   **폴링 서버의 행동:** 폴링 서버는 이벤트에서 얻은 `txHash`('0x123...')를 가지고 신나게 DB에 "이 txHash를 가진 레코드 주세요!" 라고 요청합니다. 하지만 DB에는 그런 레코드가 존재하지 않습니다. 왜냐하면 앱 서버가 `commit`을 하지 못했기 때문입니다. 따라서 폴링 서버는 아무런 작업도 수행할 수 없습니다.

#### 폴링 서버의 보완 로직 (선택적이지만 권장)

이런 상황을 대비해 폴링 서버는 다음과 같은 보완 로직을 가질 수 있습니다.

> "이벤트는 왔는데, 해당하는 `txHash`의 레코드가 DB에 없네? 이건 앱 서버의 `commit`이 아직 안됐거나 실패한 경우일 수 있으니, 몇 초(분) 뒤에 다시 조회해봐야겠다."

이런 재시도(Retry) 로직을 추가하면, 나중에 앱 서버의 부하가 풀려 `commit`이 되거나, 타임아웃으로 트랜잭션이 롤백되더라도 시스템은 안정적으로 상태를 따라갈 수 있습니다.

#### 결론

질문하신 대로, **"트랜잭션 전송"과 "이벤트 감지" 사이의 시간 차를 이용한 레이스 컨디션은 여전히 발생할 수 있습니다.**

하지만 `TransactionHandler` 구조는, 설령 그런 레이스 컨디션이 발생하더라도 **폴링 서버가 DB에서 데이터를 찾지 못하게 만듦**으로써 데이터가 꼬이는 상황을 원천적으로 차단합니다. **`commit`이라는 행위가 앱 서버와 폴링 서버 간의 유일하고 안전한 '바통 터치' 지점**이 되기 때문입니다. 폴링 서버는 `commit`이라는 바통을 받기 전까지는 절대 출발할 수 없는 것입니다.

---

### **User:** 아 그러니까 기술적으로 막을수는 없는거고, 장치만을 마련하는거네?

### **AI:** 네, 맞습니다. **정확히 보셨습니다.**

**"기술적으로 (두 서버의 동작 시간 순서를) 막는 것이 아니라, 그 순서가 꼬이더라도 데이터가 절대 오염되지 않도록 보장하는 안전 장치를 마련하는 것"**

이것이 제가 제안드린 아키텍처의 핵심 철학입니다. 그 표현이 이 상황을 가장 완벽하게 설명합니다.

우리는 분산 시스템(Distributed System) 환경에서 두 가지 사실을 통제할 수 없습니다.

1.  **네트워크 지연:** 앱 서버, DB 서버, 블록체인 노드 간의 통신 시간은 예측 불가능합니다.
2.  **독립적인 서버의 실행 속도:** 앱 서버의 부하와 폴링 서버의 부하는 서로에게 영향을 주지 않으며, 어느 쪽이 먼저 특정 작업을 완료할지 보장할 수 없습니다.

따라서 시간 순서를 "막으려고" 시도하는 것은 근본적으로 불가능하거나 매우 비효율적입니다.

대신, 우리는 **"순서가 어떻게 되든, 최종 결과는 항상 우리가 원하는 상태가 되도록 만들자"** 는 목표를 가집니다. 이것이 바로 `TransactionHandler`가 제공하는 '안전 장치'의 역할입니다.

#### 안전 장치의 작동 원리 (열쇠와 자물쇠 비유)

*   **앱 서버의 역할:** DB에 `commit`을 함으로써, 특정 `txHash`를 가진 **'자물쇠'**를 DB에 단단히 설치합니다.
*   **폴링 서버의 역할:** 블록체인에서 이벤트를 받아 `txHash`라는 **'열쇠'**를 손에 넣습니다.
*   **안전 장치:**
    *   만약 폴링 서버가 열쇠(이벤트)를 먼저 손에 넣었더라도, 앱 서버가 아직 자물쇠(DB 레코드)를 설치(`commit`)하지 않았다면, 열쇠는 아무 쓸모가 없습니다. 폴링 서버는 문을 열 수 없으니 그냥 돌아가거나, 자물쇠가 설치될 때까지 기다릴 수밖에 없습니다.
    *   앱 서버가 자물쇠를 성공적으로 설치(`commit`)한 이후라면, 폴링 서버는 언제 열쇠를 사용하든 항상 자물쇠를 열고 다음 작업을 수행할 수 있습니다.

이처럼 `commit`이라는 행위를 통해 **'자물쇠 설치'가 '열쇠 사용'의 절대적인 선행 조건이 되도록 강제**하는 것, 이것이 바로 우리가 마련한 '장치'의 실체입니다.

이러한 설계 방식은 외부 시스템 연동, 비동기 메시지 큐 처리 등 현대 백엔드 시스템에서 데이터 정합성을 지키기 위해 사용하는 매우 표준적이고 강력한 패턴입니다. 아주 중요한 포인트를 정확하게 짚어주셨습니다.

---

### **User:** 그럼 이러한 장치는 제안해준 QueryRunner등의 DB 직접 접근 메소드를 사용해야만 하는거야? 일반적인 API 구현방식으로는 어렵고?

### **AI:** 네, 그 부분도 매우 정확한 질문입니다. 일반적인 API 구현 방식으로는 왜 어려운지, 왜 `QueryRunner` 같은 직접적인 제어 도구가 필요한지 설명해 드리겠습니다.

**결론부터 말씀드리면, 네, 이 안전 장치는 `QueryRunner`와 같이 데이터베이스 트랜잭션을 직접 제어할 수 있는 방법을 사용해야만 구현할 수 있습니다.** 일반적인 API 구현 방식으로는 불가능하거나 훨씬 더 복잡하고 불안정해집니다.

#### "일반적인 API 구현 방식"의 한계

NestJS와 TypeORM에서 "일반적인 방식"은 `Repository`를 주입받아 `save()`, `update()`, `delete()` 등의 메소드를 직접 사용하는 것을 의미합니다.

```typescript
// 일반적인 방식의 예
await this.mileageRepository.save(newMileage);
```

이 방식의 가장 큰 특징은 **'자동 커밋(Auto-Commit)'**입니다. `await this.mileageRepository.save(newMileage);` 이 코드가 실행을 마치는 순간, TypeORM은 내부적으로 다음과 같은 일을 자동으로 수행합니다.

1.  트랜잭션 시작
2.  `INSERT` 쿼리 실행
3.  **즉시 트랜잭션 커밋**

각각의 `save`, `update` 호출이 그 자체로 하나의 완결된 트랜잭션입니다. **여러 개의 DB 작업과 외부 API 호출을 하나의 거대한 트랜잭션으로 묶을 수가 없습니다.**

#### 왜 일반적인 방식으로는 안전 장치를 만들 수 없는가?

만약 `QueryRunner` 없이 일반적인 방식으로 문제의 로직을 구현하려고 시도하면 다음과 같은 코드가 됩니다.

**[매우 나쁜 코드 예시 - 절대 이렇게 사용하면 안 됩니다]**

```typescript
// QueryRunner 없이 구현하려고 시도한 경우
async createMileage_BAD_EXAMPLE(createMileageDto, files) {
    // ... 파일 업로드 로직 ...

    // 1. DB에 마일리지 정보 저장 (⚠️ 이 순간 즉시 DB에 영구 저장됨)
    const savedMileage = await this.mileageRepository.save({
        ...createMileageDto,
        isConfirmed: false,
        transactionHash: null,
    });

    try {
        // 2. 블록체인에 트랜잭션 전송
        const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
        const txHash = txReceipt.transactionHash;

        // 3. txHash를 업데이트 (⚠️ 이 역시 즉시 DB에 영구 저장됨)
        await this.mileageRepository.update(savedMileage.id, { transactionHash: txHash });

        savedMileage.transactionHash = txHash;
        return savedMileage;

    } catch (error) {
        // --- 💥 치명적인 문제 발생 지점 ---
        // 만약 2번 블록체인 전송이 실패했다면?
        // 1번에서 저장한 `savedMileage`는 이미 DB에 영구적으로 저장되어 있습니다.
        // 이 데이터를 '고아 데이터(Orphan Data)'라고 부릅니다.
        // 이 데이터를 지우려면 여기서 수동으로 삭제 코드를 호출해야 합니다.
        
        // 예: await this.mileageRepository.delete(savedMileage.id);
        
        // 하지만 만약 이 delete 호출마저 실패한다면?? 데이터는 영원히 꼬이게 됩니다.
        // 이것이 바로 데이터 정합성이 깨지는 순간입니다.
        throw new InternalServerErrorException("처리 실패");
    }
}
```

보시다시피, `catch` 블록에 도달했을 때는 이미 첫 번째 `save()` 작업이 되돌릴 수 없는 강을 건넌 상태입니다. 실패한 경우를 처리하기 위해 `delete` 코드를 추가하는 등 로직이 매우 복잡해지고, 그 보상 트랜잭션(삭제)마저 실패할 수 있어 완벽한 안정성을 보장할 수 없습니다.

#### `QueryRunner`의 존재 이유

`QueryRunner`는 바로 이 문제를 해결하기 위해 존재합니다. **'자동 커밋'을 비활성화하고, 개발자가 원하는 순간에 `commit` 또는 `rollback`을 할 수 있는 권한을 제공합니다.**

`QueryRunner`를 사용함으로써 우리는 다음과 같은 선언을 할 수 있게 됩니다.

> "지금부터 `startTransaction()` 과 `commitTransaction()` 사이에서 일어나는 모든 DB 작업과, 그 사이에 끼어있는 블록체인 전송 같은 외부 API 호출까지 전부 포함해서, 이 모든 것을 하나의 성공 또는 하나의 실패로 간주하겠다."

따라서, 외부 시스템 호출처럼 실패 가능성이 있는 작업을 데이터베이스 작업과 한 묶음으로 처리해야 하는 모든 경우에는, 반드시 `QueryRunner`와 같이 트랜잭션을 수동으로 제어할 수 있는 도구를 사용해야만 합니다.

---

### **User:** 그럼 이 과정이 어떻게 이벤트 서버의 데이터 I/O와 앱 서버의 데이터 I/O 순서를 보장해줄 수 있는거야?

### **AI:** 네, 바로 그 부분이 이 아키텍처의 핵심입니다. 이 구조가 어떻게 앱 서버와 폴링(이벤트) 서버 간의 데이터 I/O 순서를 보장하는지 명확하게 설명해 드리겠습니다.

결론부터 말씀드리면, **앱 서버의 DB 작업이 '선행 조건'이 되도록 강제하여, 폴링 서버가 작업을 시도할 때 반드시 필요한 데이터가 준비되어 있도록 보장**하는 방식입니다.

두 서버의 타임라인을 비교하며 살펴보겠습니다.

---

#### **Before: 불안정한 구조 (레이스 컨디션 발생 가능)**

기존 구조에서는 두 서버의 DB 작업이 독립적으로 실행되어 순서가 꼬일 수 있었습니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 | 문제점 |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. 블록체인에 트랜잭션 전송** | | `(아무것도 없음)` | |
| **T=0.1s** | 2. (DB 저장 로직 실행 대기 중...) | | `(아무것도 없음)` | DB 부하 등으로 지연 발생 |
| **T=1.0s** | | **1. 블록체인에서 이벤트 감지 (txHash 포함)** | `(아무것도 없음)` | |
| **T=1.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | `(아무것도 없음)` | **조회 실패!** 업데이트할 레코드가 없음 |
| **T=1.2s** | | 3. (작업 종료) | `(아무것도 없음)` | |
| **T=2.0s** | 3. **DB에 데이터 생성 (`isConfirmed: 0`)** | | `mileage (id:1, isConfirmed:0)` | **영원히 `isConfirmed:0`으로 남음** |

**문제의 근본 원인:** 폴링 서버가 DB에 접근하는 **T=1.1s** 시점에, 앱 서버가 만들어야 할 데이터가 아직 존재하지 않는다는 것입니다.

---

#### **After: `TransactionHandler`를 사용한 안정적인 구조**

개선된 구조에서는 앱 서버의 작업 흐름이 변경되어 이 문제를 원천적으로 차단합니다. `commit`이 일어나는 시점이 매우 중요합니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 (임시 작업 공간) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. DB 트랜잭션 시작** | | | `(아무것도 없음)` |
| **T=0.1s** | **2. DB에 데이터 생성 (txHash=null)** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.0s** | **3. 블록체인에 트랜잭션 전송** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.1s** | **4. txHash를 DB에 업데이트** | | `mileage (id:1, txHash:'0x123...')` | `(아무것도 없음)` |
| **T=1.2s** | **5. DB 트랜잭션 커밋(commit)** | | `(모든 변경사항 폐기)` | **`mileage (id:1, txHash:'0x123...')`** |
| **T=2.0s** | | **1. 블록체인에서 이벤트 감지 (txHash:'0x123...' 포함)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.2s** | | **3. 조회 성공! `isConfirmed=true`로 업데이트** | | **`mileage (id:1, isConfirmed:true)`** |

#### 순서가 보장되는 이유

1.  **폴링 서버의 작업 트리거는 '이벤트'입니다.** 그리고 블록체인 이벤트에는 **`txHash`**가 포함됩니다. 즉, 폴링 서버는 특정 `txHash`를 가진 이벤트를 받아야만 동작을 시작합니다.

2.  **`txHash`는 앱 서버가 블록체인에 트랜잭션을 성공적으로 전송해야만 얻을 수 있습니다.** (`T=1.0s` 이후)

3.  **앱 서버는 `txHash`를 얻은 후, 그 `txHash`를 포함한 모든 정보를 데이터베이스에 `commit`합니다.** (`T=1.2s`) `commit`이 완료된 후에야 비로소 이 데이터는 다른 프로세스(폴링 서버 등)에서 조회가 가능해집니다.

4.  따라서, 폴링 서버가 이벤트를 통해 `txHash`를 알게 되는 시점(**T=2.0s**)은 **논리적으로 항상** 앱 서버가 해당 `txHash`를 포함한 레코드를 DB에 영구적으로 저장(`commit`)한 시점(**T=1.2s**)보다 **늦을 수밖에 없습니다.**

아무리 폴링 서버가 빠르고, 앱 서버의 `commit` 이후 로직이 느리더라도, 폴링 서버가 작업을 시작하는 데 필요한 '재료'(`txHash`가 저장된 DB 레코드)는 앱 서버의 `commit` 시점에 이미 완벽하게 준비되어 있는 것입니다.

결론적으로, **"폴링 서버의 작업 시작 조건(이벤트 발생)이 앱 서버의 작업 완료 조건(DB 커밋) 이후에 형성되도록"** 프로세스를 설계했기 때문에 두 서버 간의 I/O 순서가 완벽하게 보장됩니다.

---

### **User:** 이해가 안가는게, 1.0에서 트랜잭션을 전송하고 이 순간 부하가 일어나서 1.1부터의 과정이 진행되지 않는다면 2.0에 진행되는 이벤트 감지가 벌어지는 건 똑같은거 아니야? 여기서 말하는 트랜잭션 전송은 예를 들어 Kairos 테스트넷의 rpc url로 raw transaction을 전송하는거야. 내가 부가설명을 안했을 수도 있는데 폴링 서버와 앱서버는 서로 다른 포트를 사용하는 독립적인 서버라고 생각하면 돼

### **AI:** 네, 맞습니다. 그 지점이 바로 이 설계에서 가장 혼동하기 쉬운 부분이면서 동시에 가장 중요한 부분입니다. 질문해주셔서 감사합니다.

결론부터 말씀드리면, **네, 그 상황은 똑같이 발생할 수 있습니다. 하지만 `commit`을 하지 않았기 때문에 폴링 서버는 아무것도 할 수가 없습니다.** 이것이 핵심입니다.

앱 서버와 폴링 서버가 독립적인 서버라는 점을 정확히 인지하고 다시 설명해 드리겠습니다.

#### 가정된 문제 상황 (질문하신 시나리오)

| 시간 | 앱 서버 (API:3000) | 블록체인 (Kairos RPC) | 폴링 서버 (API:8080) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | 1. DB 트랜잭션 시작 | | | `(아무것도 없음)` |
| **T=0.1s** | 2. `Mileage` 레코드 임시 생성 | | | `(아무것도 없음)` |
| **T=1.0s** | 3. **Kairos RPC로 `rawTransaction` 전송** | 트랜잭션 수신 및 처리 시작 | | `(아무것도 없음)` |
| **T=1.1s** | **(앱 서버에 치명적인 부하 발생! 다음 코드 진행 불가)** | | | `(아무것도 없음)` |
| **T=2.0s** | (앱 서버 여전히 멈춰있음) | **트랜잭션 처리 완료 -> 이벤트 발생** | | `(아무것도 없음)` |
| **T=2.1s** | (앱 서버 여전히 멈춰있음) | | **1. 이벤트 감지 (txHash: '0x123...' 획득)** | `(아무것도 없음)` |
| **T=2.2s** | (앱 서버 여전히 멈춰있음) | | **2. `txHash='0x123...'`인 레코드를 DB에서 조회** | **`(아무것도 없음)`** |
| **T=2.3s** | (앱 서버 여전히 멈춰있음) | | **3. 조회 결과: 없음. `null` 반환.** | `(아무것도 없음)` |
| **T=2.4s** | (앱 서버 여전히 멈춰있음) | | **4. 할 일이 없으므로 작업 종료 또는 재시도 로직 대기** | `(아무것도 없음)` |

#### 왜 문제가 해결되는가? - "Commit의 힘"

위 시나리오에서 가장 중요한 것은 **T=2.2초**에 폴링 서버가 DB를 조회했을 때의 결과입니다.

*   **앱 서버의 상태:** 앱 서버는 **T=1.0초**에 트랜잭션을 쏘고 나서 멈췄습니다. 그래서 `txHash`를 받아오는 로직, `txHash`를 업데이트하는 로직, 그리고 가장 중요한 **`queryRunner.commitTransaction()`**을 **실행하지 못했습니다.**

*   **DB의 상태:** 데이터베이스의 관점에서 보면, 앱 서버는 트랜잭션을 시작(`startTransaction`)했지만, 최종 승인(`commit`)도, 취소(`rollback`)도 하지 않은 어정쩡한 상태로 연결이 끊겨버린 것입니다. 대부분의 데이터베이스 시스템(PostgreSQL, MySQL 등)은 이런 경우, 해당 트랜잭션을 **자동으로 롤백(Rollback)** 처리하여 트랜잭션 시작 전의 상태로 되돌립니다. 즉, **T=0.1초**에 임시로 만들었던 `Mileage` 레코드는 그냥 사라집니다.

*   **폴링 서버의 행동:** 폴링 서버는 이벤트에서 얻은 `txHash`('0x123...')를 가지고 신나게 DB에 "이 txHash를 가진 레코드 주세요!" 라고 요청합니다. 하지만 DB에는 그런 레코드가 존재하지 않습니다. 왜냐하면 앱 서버가 `commit`을 하지 못했기 때문입니다. 따라서 폴링 서버는 아무런 작업도 수행할 수 없습니다.

#### 폴링 서버의 보완 로직 (선택적이지만 권장)

이런 상황을 대비해 폴링 서버는 다음과 같은 보완 로직을 가질 수 있습니다.

> "이벤트는 왔는데, 해당하는 `txHash`의 레코드가 DB에 없네? 이건 앱 서버의 `commit`이 아직 안됐거나 실패한 경우일 수 있으니, 몇 초(분) 뒤에 다시 조회해봐야겠다."

이런 재시도(Retry) 로직을 추가하면, 나중에 앱 서버의 부하가 풀려 `commit`이 되거나, 타임아웃으로 트랜잭션이 롤백되더라도 시스템은 안정적으로 상태를 따라갈 수 있습니다.

#### 결론

질문하신 대로, **"트랜잭션 전송"과 "이벤트 감지" 사이의 시간 차를 이용한 레이스 컨디션은 여전히 발생할 수 있습니다.**

하지만 `TransactionHandler` 구조는, 설령 그런 레이스 컨디션이 발생하더라도 **폴링 서버가 DB에서 데이터를 찾지 못하게 만듦**으로써 데이터가 꼬이는 상황을 원천적으로 차단합니다. **`commit`이라는 행위가 앱 서버와 폴링 서버 간의 유일하고 안전한 '바통 터치' 지점**이 되기 때문입니다. 폴링 서버는 `commit`이라는 바통을 받기 전까지는 절대 출발할 수 없는 것입니다.

---

### **User:** 아 그러니까 기술적으로 막을수는 없는거고, 장치만을 마련하는거네?

### **AI:** 네, 맞습니다. **정확히 보셨습니다.**

**"기술적으로 (두 서버의 동작 시간 순서를) 막는 것이 아니라, 그 순서가 꼬이더라도 데이터가 절대 오염되지 않도록 보장하는 안전 장치를 마련하는 것"**

이것이 제가 제안드린 아키텍처의 핵심 철학입니다. 그 표현이 이 상황을 가장 완벽하게 설명합니다.

우리는 분산 시스템(Distributed System) 환경에서 두 가지 사실을 통제할 수 없습니다.

1.  **네트워크 지연:** 앱 서버, DB 서버, 블록체인 노드 간의 통신 시간은 예측 불가능합니다.
2.  **독립적인 서버의 실행 속도:** 앱 서버의 부하와 폴링 서버의 부하는 서로에게 영향을 주지 않으며, 어느 쪽이 먼저 특정 작업을 완료할지 보장할 수 없습니다.

따라서 시간 순서를 "막으려고" 시도하는 것은 근본적으로 불가능하거나 매우 비효율적입니다.

대신, 우리는 **"순서가 어떻게 되든, 최종 결과는 항상 우리가 원하는 상태가 되도록 만들자"** 는 목표를 가집니다. 이것이 바로 `TransactionHandler`가 제공하는 '안전 장치'의 역할입니다.

#### 안전 장치의 작동 원리 (열쇠와 자물쇠 비유)

*   **앱 서버의 역할:** DB에 `commit`을 함으로써, 특정 `txHash`를 가진 **'자물쇠'**를 DB에 단단히 설치합니다.
*   **폴링 서버의 역할:** 블록체인에서 이벤트를 받아 `txHash`라는 **'열쇠'**를 손에 넣습니다.
*   **안전 장치:**
    *   만약 폴링 서버가 열쇠(이벤트)를 먼저 손에 넣었더라도, 앱 서버가 아직 자물쇠(DB 레코드)를 설치(`commit`)하지 않았다면, 열쇠는 아무 쓸모가 없습니다. 폴링 서버는 문을 열 수 없으니 그냥 돌아가거나, 자물쇠가 설치될 때까지 기다릴 수밖에 없습니다.
    *   앱 서버가 자물쇠를 성공적으로 설치(`commit`)한 이후라면, 폴링 서버는 언제 열쇠를 사용하든 항상 자물쇠를 열고 다음 작업을 수행할 수 있습니다.

이처럼 `commit`이라는 행위를 통해 **'자물쇠 설치'가 '열쇠 사용'의 절대적인 선행 조건이 되도록 강제**하는 것, 이것이 바로 우리가 마련한 '장치'의 실체입니다.

이러한 설계 방식은 외부 시스템 연동, 비동기 메시지 큐 처리 등 현대 백엔드 시스템에서 데이터 정합성을 지키기 위해 사용하는 매우 표준적이고 강력한 패턴입니다. 아주 중요한 포인트를 정확하게 짚어주셨습니다.

---

### **User:** 그럼 이러한 장치는 제안해준 QueryRunner등의 DB 직접 접근 메소드를 사용해야만 하는거야? 일반적인 API 구현방식으로는 어렵고?

### **AI:** 네, 그 부분도 매우 정확한 질문입니다. 일반적인 API 구현 방식으로는 왜 어려운지, 왜 `QueryRunner` 같은 직접적인 제어 도구가 필요한지 설명해 드리겠습니다.

**결론부터 말씀드리면, 네, 이 안전 장치는 `QueryRunner`와 같이 데이터베이스 트랜잭션을 직접 제어할 수 있는 방법을 사용해야만 구현할 수 있습니다.** 일반적인 API 구현 방식으로는 불가능하거나 훨씬 더 복잡하고 불안정해집니다.

#### "일반적인 API 구현 방식"의 한계

NestJS와 TypeORM에서 "일반적인 방식"은 `Repository`를 주입받아 `save()`, `update()`, `delete()` 등의 메소드를 직접 사용하는 것을 의미합니다.

```typescript
// 일반적인 방식의 예
await this.mileageRepository.save(newMileage);
```

이 방식의 가장 큰 특징은 **'자동 커밋(Auto-Commit)'**입니다. `await this.mileageRepository.save(newMileage);` 이 코드가 실행을 마치는 순간, TypeORM은 내부적으로 다음과 같은 일을 자동으로 수행합니다.

1.  트랜잭션 시작
2.  `INSERT` 쿼리 실행
3.  **즉시 트랜잭션 커밋**

각각의 `save`, `update` 호출이 그 자체로 하나의 완결된 트랜잭션입니다. **여러 개의 DB 작업과 외부 API 호출을 하나의 거대한 트랜잭션으로 묶을 수가 없습니다.**

#### 왜 일반적인 방식으로는 안전 장치를 만들 수 없는가?

만약 `QueryRunner` 없이 일반적인 방식으로 문제의 로직을 구현하려고 시도하면 다음과 같은 코드가 됩니다.

**[매우 나쁜 코드 예시 - 절대 이렇게 사용하면 안 됩니다]**

```typescript
// QueryRunner 없이 구현하려고 시도한 경우
async createMileage_BAD_EXAMPLE(createMileageDto, files) {
    // ... 파일 업로드 로직 ...

    // 1. DB에 마일리지 정보 저장 (⚠️ 이 순간 즉시 DB에 영구 저장됨)
    const savedMileage = await this.mileageRepository.save({
        ...createMileageDto,
        isConfirmed: false,
        transactionHash: null,
    });

    try {
        // 2. 블록체인에 트랜잭션 전송
        const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
        const txHash = txReceipt.transactionHash;

        // 3. txHash를 업데이트 (⚠️ 이 역시 즉시 DB에 영구 저장됨)
        await this.mileageRepository.update(savedMileage.id, { transactionHash: txHash });

        savedMileage.transactionHash = txHash;
        return savedMileage;

    } catch (error) {
        // --- 💥 치명적인 문제 발생 지점 ---
        // 만약 2번 블록체인 전송이 실패했다면?
        // 1번에서 저장한 `savedMileage`는 이미 DB에 영구적으로 저장되어 있습니다.
        // 이 데이터를 '고아 데이터(Orphan Data)'라고 부릅니다.
        // 이 데이터를 지우려면 여기서 수동으로 삭제 코드를 호출해야 합니다.
        
        // 예: await this.mileageRepository.delete(savedMileage.id);
        
        // 하지만 만약 이 delete 호출마저 실패한다면?? 데이터는 영원히 꼬이게 됩니다.
        // 이것이 바로 데이터 정합성이 깨지는 순간입니다.
        throw new InternalServerErrorException("처리 실패");
    }
}
```

보시다시피, `catch` 블록에 도달했을 때는 이미 첫 번째 `save()` 작업이 되돌릴 수 없는 강을 건넌 상태입니다. 실패한 경우를 처리하기 위해 `delete` 코드를 추가하는 등 로직이 매우 복잡해지고, 그 보상 트랜잭션(삭제)마저 실패할 수 있어 완벽한 안정성을 보장할 수 없습니다.

#### `QueryRunner`의 존재 이유

`QueryRunner`는 바로 이 문제를 해결하기 위해 존재합니다. **'자동 커밋'을 비활성화하고, 개발자가 원하는 순간에 `commit` 또는 `rollback`을 할 수 있는 권한을 제공합니다.**

`QueryRunner`를 사용함으로써 우리는 다음과 같은 선언을 할 수 있게 됩니다.

> "지금부터 `startTransaction()` 과 `commitTransaction()` 사이에서 일어나는 모든 DB 작업과, 그 사이에 끼어있는 블록체인 전송 같은 외부 API 호출까지 전부 포함해서, 이 모든 것을 하나의 성공 또는 하나의 실패로 간주하겠다."

따라서, 외부 시스템 호출처럼 실패 가능성이 있는 작업을 데이터베이스 작업과 한 묶음으로 처리해야 하는 모든 경우에는, 반드시 `QueryRunner`와 같이 트랜잭션을 수동으로 제어할 수 있는 도구를 사용해야만 합니다.

---

### **User:** 그럼 이 과정이 어떻게 이벤트 서버의 데이터 I/O와 앱 서버의 데이터 I/O 순서를 보장해줄 수 있는거야?

### **AI:** 네, 바로 그 부분이 이 아키텍처의 핵심입니다. 이 구조가 어떻게 앱 서버와 폴링(이벤트) 서버 간의 데이터 I/O 순서를 보장하는지 명확하게 설명해 드리겠습니다.

결론부터 말씀드리면, **앱 서버의 DB 작업이 '선행 조건'이 되도록 강제하여, 폴링 서버가 작업을 시도할 때 반드시 필요한 데이터가 준비되어 있도록 보장**하는 방식입니다.

두 서버의 타임라인을 비교하며 살펴보겠습니다.

---

#### **Before: 불안정한 구조 (레이스 컨디션 발생 가능)**

기존 구조에서는 두 서버의 DB 작업이 독립적으로 실행되어 순서가 꼬일 수 있었습니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 | 문제점 |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. 블록체인에 트랜잭션 전송** | | `(아무것도 없음)` | |
| **T=0.1s** | 2. (DB 저장 로직 실행 대기 중...) | | `(아무것도 없음)` | DB 부하 등으로 지연 발생 |
| **T=1.0s** | | **1. 블록체인에서 이벤트 감지 (txHash 포함)** | `(아무것도 없음)` | |
| **T=1.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | `(아무것도 없음)` | **조회 실패!** 업데이트할 레코드가 없음 |
| **T=1.2s** | | 3. (작업 종료) | `(아무것도 없음)` | |
| **T=2.0s** | 3. **DB에 데이터 생성 (`isConfirmed: 0`)** | | `mileage (id:1, isConfirmed:0)` | **영원히 `isConfirmed:0`으로 남음** |

**문제의 근본 원인:** 폴링 서버가 DB에 접근하는 **T=1.1s** 시점에, 앱 서버가 만들어야 할 데이터가 아직 존재하지 않는다는 것입니다.

---

#### **After: `TransactionHandler`를 사용한 안정적인 구조**

개선된 구조에서는 앱 서버의 작업 흐름이 변경되어 이 문제를 원천적으로 차단합니다. `commit`이 일어나는 시점이 매우 중요합니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 (임시 작업 공간) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. DB 트랜잭션 시작** | | | `(아무것도 없음)` |
| **T=0.1s** | **2. DB에 데이터 생성 (txHash=null)** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.0s** | **3. 블록체인에 트랜잭션 전송** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.1s** | **4. txHash를 DB에 업데이트** | | `mileage (id:1, txHash:'0x123...')` | `(아무것도 없음)` |
| **T=1.2s** | **5. DB 트랜잭션 커밋(commit)** | | `(모든 변경사항 폐기)` | **`mileage (id:1, txHash:'0x123...')`** |
| **T=2.0s** | | **1. 블록체인에서 이벤트 감지 (txHash:'0x123...' 포함)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.2s** | | **3. 조회 성공! `isConfirmed=true`로 업데이트** | | **`mileage (id:1, isConfirmed:true)`** |

#### 순서가 보장되는 이유

1.  **폴링 서버의 작업 트리거는 '이벤트'입니다.** 그리고 블록체인 이벤트에는 **`txHash`**가 포함됩니다. 즉, 폴링 서버는 특정 `txHash`를 가진 이벤트를 받아야만 동작을 시작합니다.

2.  **`txHash`는 앱 서버가 블록체인에 트랜잭션을 성공적으로 전송해야만 얻을 수 있습니다.** (`T=1.0s` 이후)

3.  **앱 서버는 `txHash`를 얻은 후, 그 `txHash`를 포함한 모든 정보를 데이터베이스에 `commit`합니다.** (`T=1.2s`) `commit`이 완료된 후에야 비로소 이 데이터는 다른 프로세스(폴링 서버 등)에서 조회가 가능해집니다.

4.  따라서, 폴링 서버가 이벤트를 통해 `txHash`를 알게 되는 시점(**T=2.0s**)은 **논리적으로 항상** 앱 서버가 해당 `txHash`를 포함한 레코드를 DB에 영구적으로 저장(`commit`)한 시점(**T=1.2s**)보다 **늦을 수밖에 없습니다.**

아무리 폴링 서버가 빠르고, 앱 서버의 `commit` 이후 로직이 느리더라도, 폴링 서버가 작업을 시작하는 데 필요한 '재료'(`txHash`가 저장된 DB 레코드)는 앱 서버의 `commit` 시점에 이미 완벽하게 준비되어 있는 것입니다.

결론적으로, **"폴링 서버의 작업 시작 조건(이벤트 발생)이 앱 서버의 작업 완료 조건(DB 커밋) 이후에 형성되도록"** 프로세스를 설계했기 때문에 두 서버 간의 I/O 순서가 완벽하게 보장됩니다.

---

### **User:** 이해가 안가는게, 1.0에서 트랜잭션을 전송하고 이 순간 부하가 일어나서 1.1부터의 과정이 진행되지 않는다면 2.0에 진행되는 이벤트 감지가 벌어지는 건 똑같은거 아니야? 여기서 말하는 트랜잭션 전송은 예를 들어 Kairos 테스트넷의 rpc url로 raw transaction을 전송하는거야. 내가 부가설명을 안했을 수도 있는데 폴링 서버와 앱서버는 서로 다른 포트를 사용하는 독립적인 서버라고 생각하면 돼

### **AI:** 네, 맞습니다. 그 지점이 바로 이 설계에서 가장 혼동하기 쉬운 부분이면서 동시에 가장 중요한 부분입니다. 질문해주셔서 감사합니다.

결론부터 말씀드리면, **네, 그 상황은 똑같이 발생할 수 있습니다. 하지만 `commit`을 하지 않았기 때문에 폴링 서버는 아무것도 할 수가 없습니다.** 이것이 핵심입니다.

앱 서버와 폴링 서버가 독립적인 서버라는 점을 정확히 인지하고 다시 설명해 드리겠습니다.

#### 가정된 문제 상황 (질문하신 시나리오)

| 시간 | 앱 서버 (API:3000) | 블록체인 (Kairos RPC) | 폴링 서버 (API:8080) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | 1. DB 트랜잭션 시작 | | | `(아무것도 없음)` |
| **T=0.1s** | 2. `Mileage` 레코드 임시 생성 | | | `(아무것도 없음)` |
| **T=1.0s** | 3. **Kairos RPC로 `rawTransaction` 전송** | 트랜잭션 수신 및 처리 시작 | | `(아무것도 없음)` |
| **T=1.1s** | **(앱 서버에 치명적인 부하 발생! 다음 코드 진행 불가)** | | | `(아무것도 없음)` |
| **T=2.0s** | (앱 서버 여전히 멈춰있음) | **트랜잭션 처리 완료 -> 이벤트 발생** | | `(아무것도 없음)` |
| **T=2.1s** | (앱 서버 여전히 멈춰있음) | | **1. 이벤트 감지 (txHash: '0x123...' 획득)** | `(아무것도 없음)` |
| **T=2.2s** | (앱 서버 여전히 멈춰있음) | | **2. `txHash='0x123...'`인 레코드를 DB에서 조회** | **`(아무것도 없음)`** |
| **T=2.3s** | (앱 서버 여전히 멈춰있음) | | **3. 조회 결과: 없음. `null` 반환.** | `(아무것도 없음)` |
| **T=2.4s** | (앱 서버 여전히 멈춰있음) | | **4. 할 일이 없으므로 작업 종료 또는 재시도 로직 대기** | `(아무것도 없음)` |

#### 왜 문제가 해결되는가? - "Commit의 힘"

위 시나리오에서 가장 중요한 것은 **T=2.2초**에 폴링 서버가 DB를 조회했을 때의 결과입니다.

*   **앱 서버의 상태:** 앱 서버는 **T=1.0초**에 트랜잭션을 쏘고 나서 멈췄습니다. 그래서 `txHash`를 받아오는 로직, `txHash`를 업데이트하는 로직, 그리고 가장 중요한 **`queryRunner.commitTransaction()`**을 **실행하지 못했습니다.**

*   **DB의 상태:** 데이터베이스의 관점에서 보면, 앱 서버는 트랜잭션을 시작(`startTransaction`)했지만, 최종 승인(`commit`)도, 취소(`rollback`)도 하지 않은 어정쩡한 상태로 연결이 끊겨버린 것입니다. 대부분의 데이터베이스 시스템(PostgreSQL, MySQL 등)은 이런 경우, 해당 트랜잭션을 **자동으로 롤백(Rollback)** 처리하여 트랜잭션 시작 전의 상태로 되돌립니다. 즉, **T=0.1초**에 임시로 만들었던 `Mileage` 레코드는 그냥 사라집니다.

*   **폴링 서버의 행동:** 폴링 서버는 이벤트에서 얻은 `txHash`('0x123...')를 가지고 신나게 DB에 "이 txHash를 가진 레코드 주세요!" 라고 요청합니다. 하지만 DB에는 그런 레코드가 존재하지 않습니다. 왜냐하면 앱 서버가 `commit`을 하지 못했기 때문입니다. 따라서 폴링 서버는 아무런 작업도 수행할 수 없습니다.

#### 폴링 서버의 보완 로직 (선택적이지만 권장)

이런 상황을 대비해 폴링 서버는 다음과 같은 보완 로직을 가질 수 있습니다.

> "이벤트는 왔는데, 해당하는 `txHash`의 레코드가 DB에 없네? 이건 앱 서버의 `commit`이 아직 안됐거나 실패한 경우일 수 있으니, 몇 초(분) 뒤에 다시 조회해봐야겠다."

이런 재시도(Retry) 로직을 추가하면, 나중에 앱 서버의 부하가 풀려 `commit`이 되거나, 타임아웃으로 트랜잭션이 롤백되더라도 시스템은 안정적으로 상태를 따라갈 수 있습니다.

#### 결론

질문하신 대로, **"트랜잭션 전송"과 "이벤트 감지" 사이의 시간 차를 이용한 레이스 컨디션은 여전히 발생할 수 있습니다.**

하지만 `TransactionHandler` 구조는, 설령 그런 레이스 컨디션이 발생하더라도 **폴링 서버가 DB에서 데이터를 찾지 못하게 만듦**으로써 데이터가 꼬이는 상황을 원천적으로 차단합니다. **`commit`이라는 행위가 앱 서버와 폴링 서버 간의 유일하고 안전한 '바통 터치' 지점**이 되기 때문입니다. 폴링 서버는 `commit`이라는 바통을 받기 전까지는 절대 출발할 수 없는 것입니다.

---

### **User:** 아 그러니까 기술적으로 막을수는 없는거고, 장치만을 마련하는거네?

### **AI:** 네, 맞습니다. **정확히 보셨습니다.**

**"기술적으로 (두 서버의 동작 시간 순서를) 막는 것이 아니라, 그 순서가 꼬이더라도 데이터가 절대 오염되지 않도록 보장하는 안전 장치를 마련하는 것"**

이것이 제가 제안드린 아키텍처의 핵심 철학입니다. 그 표현이 이 상황을 가장 완벽하게 설명합니다.

우리는 분산 시스템(Distributed System) 환경에서 두 가지 사실을 통제할 수 없습니다.

1.  **네트워크 지연:** 앱 서버, DB 서버, 블록체인 노드 간의 통신 시간은 예측 불가능합니다.
2.  **독립적인 서버의 실행 속도:** 앱 서버의 부하와 폴링 서버의 부하는 서로에게 영향을 주지 않으며, 어느 쪽이 먼저 특정 작업을 완료할지 보장할 수 없습니다.

따라서 시간 순서를 "막으려고" 시도하는 것은 근본적으로 불가능하거나 매우 비효율적입니다.

대신, 우리는 **"순서가 어떻게 되든, 최종 결과는 항상 우리가 원하는 상태가 되도록 만들자"** 는 목표를 가집니다. 이것이 바로 `TransactionHandler`가 제공하는 '안전 장치'의 역할입니다.

#### 안전 장치의 작동 원리 (열쇠와 자물쇠 비유)

*   **앱 서버의 역할:** DB에 `commit`을 함으로써, 특정 `txHash`를 가진 **'자물쇠'**를 DB에 단단히 설치합니다.
*   **폴링 서버의 역할:** 블록체인에서 이벤트를 받아 `txHash`라는 **'열쇠'**를 손에 넣습니다.
*   **안전 장치:**
    *   만약 폴링 서버가 열쇠(이벤트)를 먼저 손에 넣었더라도, 앱 서버가 아직 자물쇠(DB 레코드)를 설치(`commit`)하지 않았다면, 열쇠는 아무 쓸모가 없습니다. 폴링 서버는 문을 열 수 없으니 그냥 돌아가거나, 자물쇠가 설치될 때까지 기다릴 수밖에 없습니다.
    *   앱 서버가 자물쇠를 성공적으로 설치(`commit`)한 이후라면, 폴링 서버는 언제 열쇠를 사용하든 항상 자물쇠를 열고 다음 작업을 수행할 수 있습니다.

이처럼 `commit`이라는 행위를 통해 **'자물쇠 설치'가 '열쇠 사용'의 절대적인 선행 조건이 되도록 강제**하는 것, 이것이 바로 우리가 마련한 '장치'의 실체입니다.

이러한 설계 방식은 외부 시스템 연동, 비동기 메시지 큐 처리 등 현대 백엔드 시스템에서 데이터 정합성을 지키기 위해 사용하는 매우 표준적이고 강력한 패턴입니다. 아주 중요한 포인트를 정확하게 짚어주셨습니다.

---

### **User:** 그럼 이러한 장치는 제안해준 QueryRunner등의 DB 직접 접근 메소드를 사용해야만 하는거야? 일반적인 API 구현방식으로는 어렵고?

### **AI:** 네, 그 부분도 매우 정확한 질문입니다. 일반적인 API 구현 방식으로는 왜 어려운지, 왜 `QueryRunner` 같은 직접적인 제어 도구가 필요한지 설명해 드리겠습니다.

**결론부터 말씀드리면, 네, 이 안전 장치는 `QueryRunner`와 같이 데이터베이스 트랜잭션을 직접 제어할 수 있는 방법을 사용해야만 구현할 수 있습니다.** 일반적인 API 구현 방식으로는 불가능하거나 훨씬 더 복잡하고 불안정해집니다.

#### "일반적인 API 구현 방식"의 한계

NestJS와 TypeORM에서 "일반적인 방식"은 `Repository`를 주입받아 `save()`, `update()`, `delete()` 등의 메소드를 직접 사용하는 것을 의미합니다.

```typescript
// 일반적인 방식의 예
await this.mileageRepository.save(newMileage);
```

이 방식의 가장 큰 특징은 **'자동 커밋(Auto-Commit)'**입니다. `await this.mileageRepository.save(newMileage);` 이 코드가 실행을 마치는 순간, TypeORM은 내부적으로 다음과 같은 일을 자동으로 수행합니다.

1.  트랜잭션 시작
2.  `INSERT` 쿼리 실행
3.  **즉시 트랜잭션 커밋**

각각의 `save`, `update` 호출이 그 자체로 하나의 완결된 트랜잭션입니다. **여러 개의 DB 작업과 외부 API 호출을 하나의 거대한 트랜잭션으로 묶을 수가 없습니다.**

#### 왜 일반적인 방식으로는 안전 장치를 만들 수 없는가?

만약 `QueryRunner` 없이 일반적인 방식으로 문제의 로직을 구현하려고 시도하면 다음과 같은 코드가 됩니다.

**[매우 나쁜 코드 예시 - 절대 이렇게 사용하면 안 됩니다]**

```typescript
// QueryRunner 없이 구현하려고 시도한 경우
async createMileage_BAD_EXAMPLE(createMileageDto, files) {
    // ... 파일 업로드 로직 ...

    // 1. DB에 마일리지 정보 저장 (⚠️ 이 순간 즉시 DB에 영구 저장됨)
    const savedMileage = await this.mileageRepository.save({
        ...createMileageDto,
        isConfirmed: false,
        transactionHash: null,
    });

    try {
        // 2. 블록체인에 트랜잭션 전송
        const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
        const txHash = txReceipt.transactionHash;

        // 3. txHash를 업데이트 (⚠️ 이 역시 즉시 DB에 영구 저장됨)
        await this.mileageRepository.update(savedMileage.id, { transactionHash: txHash });

        savedMileage.transactionHash = txHash;
        return savedMileage;

    } catch (error) {
        // --- 💥 치명적인 문제 발생 지점 ---
        // 만약 2번 블록체인 전송이 실패했다면?
        // 1번에서 저장한 `savedMileage`는 이미 DB에 영구적으로 저장되어 있습니다.
        // 이 데이터를 '고아 데이터(Orphan Data)'라고 부릅니다.
        // 이 데이터를 지우려면 여기서 수동으로 삭제 코드를 호출해야 합니다.
        
        // 예: await this.mileageRepository.delete(savedMileage.id);
        
        // 하지만 만약 이 delete 호출마저 실패한다면?? 데이터는 영원히 꼬이게 됩니다.
        // 이것이 바로 데이터 정합성이 깨지는 순간입니다.
        throw new InternalServerErrorException("처리 실패");
    }
}
```

보시다시피, `catch` 블록에 도달했을 때는 이미 첫 번째 `save()` 작업이 되돌릴 수 없는 강을 건넌 상태입니다. 실패한 경우를 처리하기 위해 `delete` 코드를 추가하는 등 로직이 매우 복잡해지고, 그 보상 트랜잭션(삭제)마저 실패할 수 있어 완벽한 안정성을 보장할 수 없습니다.

#### `QueryRunner`의 존재 이유

`QueryRunner`는 바로 이 문제를 해결하기 위해 존재합니다. **'자동 커밋'을 비활성화하고, 개발자가 원하는 순간에 `commit` 또는 `rollback`을 할 수 있는 권한을 제공합니다.**

`QueryRunner`를 사용함으로써 우리는 다음과 같은 선언을 할 수 있게 됩니다.

> "지금부터 `startTransaction()` 과 `commitTransaction()` 사이에서 일어나는 모든 DB 작업과, 그 사이에 끼어있는 블록체인 전송 같은 외부 API 호출까지 전부 포함해서, 이 모든 것을 하나의 성공 또는 하나의 실패로 간주하겠다."

따라서, 외부 시스템 호출처럼 실패 가능성이 있는 작업을 데이터베이스 작업과 한 묶음으로 처리해야 하는 모든 경우에는, 반드시 `QueryRunner`와 같이 트랜잭션을 수동으로 제어할 수 있는 도구를 사용해야만 합니다.

---

### **User:** 그럼 이 과정이 어떻게 이벤트 서버의 데이터 I/O와 앱 서버의 데이터 I/O 순서를 보장해줄 수 있는거야?

### **AI:** 네, 바로 그 부분이 이 아키텍처의 핵심입니다. 이 구조가 어떻게 앱 서버와 폴링(이벤트) 서버 간의 데이터 I/O 순서를 보장하는지 명확하게 설명해 드리겠습니다.

결론부터 말씀드리면, **앱 서버의 DB 작업이 '선행 조건'이 되도록 강제하여, 폴링 서버가 작업을 시도할 때 반드시 필요한 데이터가 준비되어 있도록 보장**하는 방식입니다.

두 서버의 타임라인을 비교하며 살펴보겠습니다.

---

#### **Before: 불안정한 구조 (레이스 컨디션 발생 가능)**

기존 구조에서는 두 서버의 DB 작업이 독립적으로 실행되어 순서가 꼬일 수 있었습니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 | 문제점 |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. 블록체인에 트랜잭션 전송** | | `(아무것도 없음)` | |
| **T=0.1s** | 2. (DB 저장 로직 실행 대기 중...) | | `(아무것도 없음)` | DB 부하 등으로 지연 발생 |
| **T=1.0s** | | **1. 블록체인에서 이벤트 감지 (txHash 포함)** | `(아무것도 없음)` | |
| **T=1.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | `(아무것도 없음)` | **조회 실패!** 업데이트할 레코드가 없음 |
| **T=1.2s** | | 3. (작업 종료) | `(아무것도 없음)` | |
| **T=2.0s** | 3. **DB에 데이터 생성 (`isConfirmed: 0`)** | | `mileage (id:1, isConfirmed:0)` | **영원히 `isConfirmed:0`으로 남음** |

**문제의 근본 원인:** 폴링 서버가 DB에 접근하는 **T=1.1s** 시점에, 앱 서버가 만들어야 할 데이터가 아직 존재하지 않는다는 것입니다.

---

#### **After: `TransactionHandler`를 사용한 안정적인 구조**

개선된 구조에서는 앱 서버의 작업 흐름이 변경되어 이 문제를 원천적으로 차단합니다. `commit`이 일어나는 시점이 매우 중요합니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 (임시 작업 공간) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. DB 트랜잭션 시작** | | | `(아무것도 없음)` |
| **T=0.1s** | **2. DB에 데이터 생성 (txHash=null)** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.0s** | **3. 블록체인에 트랜잭션 전송** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.1s** | **4. txHash를 DB에 업데이트** | | `mileage (id:1, txHash:'0x123...')` | `(아무것도 없음)` |
| **T=1.2s** | **5. DB 트랜잭션 커밋(commit)** | | `(모든 변경사항 폐기)` | **`mileage (id:1, txHash:'0x123...')`** |
| **T=2.0s** | | **1. 블록체인에서 이벤트 감지 (txHash:'0x123...' 포함)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.2s** | | **3. 조회 성공! `isConfirmed=true`로 업데이트** | | **`mileage (id:1, isConfirmed:true)`** |

#### 순서가 보장되는 이유

1.  **폴링 서버의 작업 트리거는 '이벤트'입니다.** 그리고 블록체인 이벤트에는 **`txHash`**가 포함됩니다. 즉, 폴링 서버는 특정 `txHash`를 가진 이벤트를 받아야만 동작을 시작합니다.

2.  **`txHash`는 앱 서버가 블록체인에 트랜잭션을 성공적으로 전송해야만 얻을 수 있습니다.** (`T=1.0s` 이후)

3.  **앱 서버는 `txHash`를 얻은 후, 그 `txHash`를 포함한 모든 정보를 데이터베이스에 `commit`합니다.** (`T=1.2s`) `commit`이 완료된 후에야 비로소 이 데이터는 다른 프로세스(폴링 서버 등)에서 조회가 가능해집니다.

4.  따라서, 폴링 서버가 이벤트를 통해 `txHash`를 알게 되는 시점(**T=2.0s**)은 **논리적으로 항상** 앱 서버가 해당 `txHash`를 포함한 레코드를 DB에 영구적으로 저장(`commit`)한 시점(**T=1.2s**)보다 **늦을 수밖에 없습니다.**

아무리 폴링 서버가 빠르고, 앱 서버의 `commit` 이후 로직이 느리더라도, 폴링 서버가 작업을 시작하는 데 필요한 '재료'(`txHash`가 저장된 DB 레코드)는 앱 서버의 `commit` 시점에 이미 완벽하게 준비되어 있는 것입니다.

결론적으로, **"폴링 서버의 작업 시작 조건(이벤트 발생)이 앱 서버의 작업 완료 조건(DB 커밋) 이후에 형성되도록"** 프로세스를 설계했기 때문에 두 서버 간의 I/O 순서가 완벽하게 보장됩니다.

---

### **User:** 이해가 안가는게, 1.0에서 트랜잭션을 전송하고 이 순간 부하가 일어나서 1.1부터의 과정이 진행되지 않는다면 2.0에 진행되는 이벤트 감지가 벌어지는 건 똑같은거 아니야? 여기서 말하는 트랜잭션 전송은 예를 들어 Kairos 테스트넷의 rpc url로 raw transaction을 전송하는거야. 내가 부가설명을 안했을 수도 있는데 폴링 서버와 앱서버는 서로 다른 포트를 사용하는 독립적인 서버라고 생각하면 돼

### **AI:** 네, 맞습니다. 그 지점이 바로 이 설계에서 가장 혼동하기 쉬운 부분이면서 동시에 가장 중요한 부분입니다. 질문해주셔서 감사합니다.

결론부터 말씀드리면, **네, 그 상황은 똑같이 발생할 수 있습니다. 하지만 `commit`을 하지 않았기 때문에 폴링 서버는 아무것도 할 수가 없습니다.** 이것이 핵심입니다.

앱 서버와 폴링 서버가 독립적인 서버라는 점을 정확히 인지하고 다시 설명해 드리겠습니다.

#### 가정된 문제 상황 (질문하신 시나리오)

| 시간 | 앱 서버 (API:3000) | 블록체인 (Kairos RPC) | 폴링 서버 (API:8080) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | 1. DB 트랜잭션 시작 | | | `(아무것도 없음)` |
| **T=0.1s** | 2. `Mileage` 레코드 임시 생성 | | | `(아무것도 없음)` |
| **T=1.0s** | 3. **Kairos RPC로 `rawTransaction` 전송** | 트랜잭션 수신 및 처리 시작 | | `(아무것도 없음)` |
| **T=1.1s** | **(앱 서버에 치명적인 부하 발생! 다음 코드 진행 불가)** | | | `(아무것도 없음)` |
| **T=2.0s** | (앱 서버 여전히 멈춰있음) | **트랜잭션 처리 완료 -> 이벤트 발생** | | `(아무것도 없음)` |
| **T=2.1s** | (앱 서버 여전히 멈춰있음) | | **1. 이벤트 감지 (txHash: '0x123...' 획득)** | `(아무것도 없음)` |
| **T=2.2s** | (앱 서버 여전히 멈춰있음) | | **2. `txHash='0x123...'`인 레코드를 DB에서 조회** | **`(아무것도 없음)`** |
| **T=2.3s** | (앱 서버 여전히 멈춰있음) | | **3. 조회 결과: 없음. `null` 반환.** | `(아무것도 없음)` |
| **T=2.4s** | (앱 서버 여전히 멈춰있음) | | **4. 할 일이 없으므로 작업 종료 또는 재시도 로직 대기** | `(아무것도 없음)` |

#### 왜 문제가 해결되는가? - "Commit의 힘"

위 시나리오에서 가장 중요한 것은 **T=2.2초**에 폴링 서버가 DB를 조회했을 때의 결과입니다.

*   **앱 서버의 상태:** 앱 서버는 **T=1.0초**에 트랜잭션을 쏘고 나서 멈췄습니다. 그래서 `txHash`를 받아오는 로직, `txHash`를 업데이트하는 로직, 그리고 가장 중요한 **`queryRunner.commitTransaction()`**을 **실행하지 못했습니다.**

*   **DB의 상태:** 데이터베이스의 관점에서 보면, 앱 서버는 트랜잭션을 시작(`startTransaction`)했지만, 최종 승인(`commit`)도, 취소(`rollback`)도 하지 않은 어정쩡한 상태로 연결이 끊겨버린 것입니다. 대부분의 데이터베이스 시스템(PostgreSQL, MySQL 등)은 이런 경우, 해당 트랜잭션을 **자동으로 롤백(Rollback)** 처리하여 트랜잭션 시작 전의 상태로 되돌립니다. 즉, **T=0.1초**에 임시로 만들었던 `Mileage` 레코드는 그냥 사라집니다.

*   **폴링 서버의 행동:** 폴링 서버는 이벤트에서 얻은 `txHash`('0x123...')를 가지고 신나게 DB에 "이 txHash를 가진 레코드 주세요!" 라고 요청합니다. 하지만 DB에는 그런 레코드가 존재하지 않습니다. 왜냐하면 앱 서버가 `commit`을 하지 못했기 때문입니다. 따라서 폴링 서버는 아무런 작업도 수행할 수 없습니다.

#### 폴링 서버의 보완 로직 (선택적이지만 권장)

이런 상황을 대비해 폴링 서버는 다음과 같은 보완 로직을 가질 수 있습니다.

> "이벤트는 왔는데, 해당하는 `txHash`의 레코드가 DB에 없네? 이건 앱 서버의 `commit`이 아직 안됐거나 실패한 경우일 수 있으니, 몇 초(분) 뒤에 다시 조회해봐야겠다."

이런 재시도(Retry) 로직을 추가하면, 나중에 앱 서버의 부하가 풀려 `commit`이 되거나, 타임아웃으로 트랜잭션이 롤백되더라도 시스템은 안정적으로 상태를 따라갈 수 있습니다.

#### 결론

질문하신 대로, **"트랜잭션 전송"과 "이벤트 감지" 사이의 시간 차를 이용한 레이스 컨디션은 여전히 발생할 수 있습니다.**

하지만 `TransactionHandler` 구조는, 설령 그런 레이스 컨디션이 발생하더라도 **폴링 서버가 DB에서 데이터를 찾지 못하게 만듦**으로써 데이터가 꼬이는 상황을 원천적으로 차단합니다. **`commit`이라는 행위가 앱 서버와 폴링 서버 간의 유일하고 안전한 '바통 터치' 지점**이 되기 때문입니다. 폴링 서버는 `commit`이라는 바통을 받기 전까지는 절대 출발할 수 없는 것입니다.

---

### **User:** 아 그러니까 기술적으로 막을수는 없는거고, 장치만을 마련하는거네?

### **AI:** 네, 맞습니다. **정확히 보셨습니다.**

**"기술적으로 (두 서버의 동작 시간 순서를) 막는 것이 아니라, 그 순서가 꼬이더라도 데이터가 절대 오염되지 않도록 보장하는 안전 장치를 마련하는 것"**

이것이 제가 제안드린 아키텍처의 핵심 철학입니다. 그 표현이 이 상황을 가장 완벽하게 설명합니다.

우리는 분산 시스템(Distributed System) 환경에서 두 가지 사실을 통제할 수 없습니다.

1.  **네트워크 지연:** 앱 서버, DB 서버, 블록체인 노드 간의 통신 시간은 예측 불가능합니다.
2.  **독립적인 서버의 실행 속도:** 앱 서버의 부하와 폴링 서버의 부하는 서로에게 영향을 주지 않으며, 어느 쪽이 먼저 특정 작업을 완료할지 보장할 수 없습니다.

따라서 시간 순서를 "막으려고" 시도하는 것은 근본적으로 불가능하거나 매우 비효율적입니다.

대신, 우리는 **"순서가 어떻게 되든, 최종 결과는 항상 우리가 원하는 상태가 되도록 만들자"** 는 목표를 가집니다. 이것이 바로 `TransactionHandler`가 제공하는 '안전 장치'의 역할입니다.

#### 안전 장치의 작동 원리 (열쇠와 자물쇠 비유)

*   **앱 서버의 역할:** DB에 `commit`을 함으로써, 특정 `txHash`를 가진 **'자물쇠'**를 DB에 단단히 설치합니다.
*   **폴링 서버의 역할:** 블록체인에서 이벤트를 받아 `txHash`라는 **'열쇠'**를 손에 넣습니다.
*   **안전 장치:**
    *   만약 폴링 서버가 열쇠(이벤트)를 먼저 손에 넣었더라도, 앱 서버가 아직 자물쇠(DB 레코드)를 설치(`commit`)하지 않았다면, 열쇠는 아무 쓸모가 없습니다. 폴링 서버는 문을 열 수 없으니 그냥 돌아가거나, 자물쇠가 설치될 때까지 기다릴 수밖에 없습니다.
    *   앱 서버가 자물쇠를 성공적으로 설치(`commit`)한 이후라면, 폴링 서버는 언제 열쇠를 사용하든 항상 자물쇠를 열고 다음 작업을 수행할 수 있습니다.

이처럼 `commit`이라는 행위를 통해 **'자물쇠 설치'가 '열쇠 사용'의 절대적인 선행 조건이 되도록 강제**하는 것, 이것이 바로 우리가 마련한 '장치'의 실체입니다.

이러한 설계 방식은 외부 시스템 연동, 비동기 메시지 큐 처리 등 현대 백엔드 시스템에서 데이터 정합성을 지키기 위해 사용하는 매우 표준적이고 강력한 패턴입니다. 아주 중요한 포인트를 정확하게 짚어주셨습니다.

---

### **User:** 그럼 이러한 장치는 제안해준 QueryRunner등의 DB 직접 접근 메소드를 사용해야만 하는거야? 일반적인 API 구현방식으로는 어렵고?

### **AI:** 네, 그 부분도 매우 정확한 질문입니다. 일반적인 API 구현 방식으로는 왜 어려운지, 왜 `QueryRunner` 같은 직접적인 제어 도구가 필요한지 설명해 드리겠습니다.

**결론부터 말씀드리면, 네, 이 안전 장치는 `QueryRunner`와 같이 데이터베이스 트랜잭션을 직접 제어할 수 있는 방법을 사용해야만 구현할 수 있습니다.** 일반적인 API 구현 방식으로는 불가능하거나 훨씬 더 복잡하고 불안정해집니다.

#### "일반적인 API 구현 방식"의 한계

NestJS와 TypeORM에서 "일반적인 방식"은 `Repository`를 주입받아 `save()`, `update()`, `delete()` 등의 메소드를 직접 사용하는 것을 의미합니다.

```typescript
// 일반적인 방식의 예
await this.mileageRepository.save(newMileage);
```

이 방식의 가장 큰 특징은 **'자동 커밋(Auto-Commit)'**입니다. `await this.mileageRepository.save(newMileage);` 이 코드가 실행을 마치는 순간, TypeORM은 내부적으로 다음과 같은 일을 자동으로 수행합니다.

1.  트랜잭션 시작
2.  `INSERT` 쿼리 실행
3.  **즉시 트랜잭션 커밋**

각각의 `save`, `update` 호출이 그 자체로 하나의 완결된 트랜잭션입니다. **여러 개의 DB 작업과 외부 API 호출을 하나의 거대한 트랜잭션으로 묶을 수가 없습니다.**

#### 왜 일반적인 방식으로는 안전 장치를 만들 수 없는가?

만약 `QueryRunner` 없이 일반적인 방식으로 문제의 로직을 구현하려고 시도하면 다음과 같은 코드가 됩니다.

**[매우 나쁜 코드 예시 - 절대 이렇게 사용하면 안 됩니다]**

```typescript
// QueryRunner 없이 구현하려고 시도한 경우
async createMileage_BAD_EXAMPLE(createMileageDto, files) {
    // ... 파일 업로드 로직 ...

    // 1. DB에 마일리지 정보 저장 (⚠️ 이 순간 즉시 DB에 영구 저장됨)
    const savedMileage = await this.mileageRepository.save({
        ...createMileageDto,
        isConfirmed: false,
        transactionHash: null,
    });

    try {
        // 2. 블록체인에 트랜잭션 전송
        const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
        const txHash = txReceipt.transactionHash;

        // 3. txHash를 업데이트 (⚠️ 이 역시 즉시 DB에 영구 저장됨)
        await this.mileageRepository.update(savedMileage.id, { transactionHash: txHash });

        savedMileage.transactionHash = txHash;
        return savedMileage;

    } catch (error) {
        // --- 💥 치명적인 문제 발생 지점 ---
        // 만약 2번 블록체인 전송이 실패했다면?
        // 1번에서 저장한 `savedMileage`는 이미 DB에 영구적으로 저장되어 있습니다.
        // 이 데이터를 '고아 데이터(Orphan Data)'라고 부릅니다.
        // 이 데이터를 지우려면 여기서 수동으로 삭제 코드를 호출해야 합니다.
        
        // 예: await this.mileageRepository.delete(savedMileage.id);
        
        // 하지만 만약 이 delete 호출마저 실패한다면?? 데이터는 영원히 꼬이게 됩니다.
        // 이것이 바로 데이터 정합성이 깨지는 순간입니다.
        throw new InternalServerErrorException("처리 실패");
    }
}
```

보시다시피, `catch` 블록에 도달했을 때는 이미 첫 번째 `save()` 작업이 되돌릴 수 없는 강을 건넌 상태입니다. 실패한 경우를 처리하기 위해 `delete` 코드를 추가하는 등 로직이 매우 복잡해지고, 그 보상 트랜잭션(삭제)마저 실패할 수 있어 완벽한 안정성을 보장할 수 없습니다.

#### `QueryRunner`의 존재 이유

`QueryRunner`는 바로 이 문제를 해결하기 위해 존재합니다. **'자동 커밋'을 비활성화하고, 개발자가 원하는 순간에 `commit` 또는 `rollback`을 할 수 있는 권한을 제공합니다.**

`QueryRunner`를 사용함으로써 우리는 다음과 같은 선언을 할 수 있게 됩니다.

> "지금부터 `startTransaction()` 과 `commitTransaction()` 사이에서 일어나는 모든 DB 작업과, 그 사이에 끼어있는 블록체인 전송 같은 외부 API 호출까지 전부 포함해서, 이 모든 것을 하나의 성공 또는 하나의 실패로 간주하겠다."

따라서, 외부 시스템 호출처럼 실패 가능성이 있는 작업을 데이터베이스 작업과 한 묶음으로 처리해야 하는 모든 경우에는, 반드시 `QueryRunner`와 같이 트랜잭션을 수동으로 제어할 수 있는 도구를 사용해야만 합니다.

---

### **User:** 그럼 이 과정이 어떻게 이벤트 서버의 데이터 I/O와 앱 서버의 데이터 I/O 순서를 보장해줄 수 있는거야?

### **AI:** 네, 바로 그 부분이 이 아키텍처의 핵심입니다. 이 구조가 어떻게 앱 서버와 폴링(이벤트) 서버 간의 데이터 I/O 순서를 보장하는지 명확하게 설명해 드리겠습니다.

결론부터 말씀드리면, **앱 서버의 DB 작업이 '선행 조건'이 되도록 강제하여, 폴링 서버가 작업을 시도할 때 반드시 필요한 데이터가 준비되어 있도록 보장**하는 방식입니다.

두 서버의 타임라인을 비교하며 살펴보겠습니다.

---

#### **Before: 불안정한 구조 (레이스 컨디션 발생 가능)**

기존 구조에서는 두 서버의 DB 작업이 독립적으로 실행되어 순서가 꼬일 수 있었습니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 | 문제점 |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. 블록체인에 트랜잭션 전송** | | `(아무것도 없음)` | |
| **T=0.1s** | 2. (DB 저장 로직 실행 대기 중...) | | `(아무것도 없음)` | DB 부하 등으로 지연 발생 |
| **T=1.0s** | | **1. 블록체인에서 이벤트 감지 (txHash 포함)** | `(아무것도 없음)` | |
| **T=1.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | `(아무것도 없음)` | **조회 실패!** 업데이트할 레코드가 없음 |
| **T=1.2s** | | 3. (작업 종료) | `(아무것도 없음)` | |
| **T=2.0s** | 3. **DB에 데이터 생성 (`isConfirmed: 0`)** | | `mileage (id:1, isConfirmed:0)` | **영원히 `isConfirmed:0`으로 남음** |

**문제의 근본 원인:** 폴링 서버가 DB에 접근하는 **T=1.1s** 시점에, 앱 서버가 만들어야 할 데이터가 아직 존재하지 않는다는 것입니다.

---

#### **After: `TransactionHandler`를 사용한 안정적인 구조**

개선된 구조에서는 앱 서버의 작업 흐름이 변경되어 이 문제를 원천적으로 차단합니다. `commit`이 일어나는 시점이 매우 중요합니다.

| 시간 | 앱 서버 (API 요청 처리) | 폴링 서버 (이벤트 감지) | DB 상태 (임시 작업 공간) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | **1. DB 트랜잭션 시작** | | | `(아무것도 없음)` |
| **T=0.1s** | **2. DB에 데이터 생성 (txHash=null)** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.0s** | **3. 블록체인에 트랜잭션 전송** | | `mileage (id:1, txHash:null)` | `(아무것도 없음)` |
| **T=1.1s** | **4. txHash를 DB에 업데이트** | | `mileage (id:1, txHash:'0x123...')` | `(아무것도 없음)` |
| **T=1.2s** | **5. DB 트랜잭션 커밋(commit)** | | `(모든 변경사항 폐기)` | **`mileage (id:1, txHash:'0x123...')`** |
| **T=2.0s** | | **1. 블록체인에서 이벤트 감지 (txHash:'0x123...' 포함)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.1s** | | **2. `txHash`로 DB 레코드 조회 (UPDATE 시도)** | | `mileage (id:1, txHash:'0x123...')` |
| **T=2.2s** | | **3. 조회 성공! `isConfirmed=true`로 업데이트** | | **`mileage (id:1, isConfirmed:true)`** |

#### 순서가 보장되는 이유

1.  **폴링 서버의 작업 트리거는 '이벤트'입니다.** 그리고 블록체인 이벤트에는 **`txHash`**가 포함됩니다. 즉, 폴링 서버는 특정 `txHash`를 가진 이벤트를 받아야만 동작을 시작합니다.

2.  **`txHash`는 앱 서버가 블록체인에 트랜잭션을 성공적으로 전송해야만 얻을 수 있습니다.** (`T=1.0s` 이후)

3.  **앱 서버는 `txHash`를 얻은 후, 그 `txHash`를 포함한 모든 정보를 데이터베이스에 `commit`합니다.** (`T=1.2s`) `commit`이 완료된 후에야 비로소 이 데이터는 다른 프로세스(폴링 서버 등)에서 조회가 가능해집니다.

4.  따라서, 폴링 서버가 이벤트를 통해 `txHash`를 알게 되는 시점(**T=2.0s**)은 **논리적으로 항상** 앱 서버가 해당 `txHash`를 포함한 레코드를 DB에 영구적으로 저장(`commit`)한 시점(**T=1.2s**)보다 **늦을 수밖에 없습니다.**

아무리 폴링 서버가 빠르고, 앱 서버의 `commit` 이후 로직이 느리더라도, 폴링 서버가 작업을 시작하는 데 필요한 '재료'(`txHash`가 저장된 DB 레코드)는 앱 서버의 `commit` 시점에 이미 완벽하게 준비되어 있는 것입니다.

결론적으로, **"폴링 서버의 작업 시작 조건(이벤트 발생)이 앱 서버의 작업 완료 조건(DB 커밋) 이후에 형성되도록"** 프로세스를 설계했기 때문에 두 서버 간의 I/O 순서가 완벽하게 보장됩니다.

---

### **User:** 이해가 안가는게, 1.0에서 트랜잭션을 전송하고 이 순간 부하가 일어나서 1.1부터의 과정이 진행되지 않는다면 2.0에 진행되는 이벤트 감지가 벌어지는 건 똑같은거 아니야? 여기서 말하는 트랜잭션 전송은 예를 들어 Kairos 테스트넷의 rpc url로 raw transaction을 전송하는거야. 내가 부가설명을 안했을 수도 있는데 폴링 서버와 앱서버는 서로 다른 포트를 사용하는 독립적인 서버라고 생각하면 돼

### **AI:** 네, 맞습니다. 그 지점이 바로 이 설계에서 가장 혼동하기 쉬운 부분이면서 동시에 가장 중요한 부분입니다. 질문해주셔서 감사합니다.

결론부터 말씀드리면, **네, 그 상황은 똑같이 발생할 수 있습니다. 하지만 `commit`을 하지 않았기 때문에 폴링 서버는 아무것도 할 수가 없습니다.** 이것이 핵심입니다.

앱 서버와 폴링 서버가 독립적인 서버라는 점을 정확히 인지하고 다시 설명해 드리겠습니다.

#### 가정된 문제 상황 (질문하신 시나리오)

| 시간 | 앱 서버 (API:3000) | 블록체인 (Kairos RPC) | 폴링 서버 (API:8080) | DB 상태 (영구 저장소) |
| :--- | :--- | :--- | :--- | :--- |
| **T=0.0s** | 1. DB 트랜잭션 시작 | | | `(아무것도 없음)` |
| **T=0.1s** | 2. `Mileage` 레코드 임시 생성 | | | `(아무것도 없음)` |
| **T=1.0s** | 3. **Kairos RPC로 `rawTransaction` 전송** | 트랜잭션 수신 및 처리 시작 | | `(아무것도 없음)` |
| **T=1.1s** | **(앱 서버에 치명적인 부하 발생! 다음 코드 진행 불가)** | | | `(아무것도 없음)` |
| **T=2.0s** | (앱 서버 여전히 멈춰있음) | **트랜잭션 처리 완료 -> 이벤트 발생** | | `(아무것도 없음)` |
| **T=2.1s** | (앱 서버 여전히 멈춰있음) | | **1. 이벤트 감지 (txHash: '0x123...' 획득)** | `(아무것도 없음)` |
| **T=2.2s** | (앱 서버 여전히 멈춰있음) | | **2. `txHash='0x123...'`인 레코드를 DB에서 조회** | **`(아무것도 없음)`** |
| **T=2.3s** | (앱 서버 여전히 멈춰있음) | | **3. 조회 결과: 없음. `null` 반환.** | `(아무것도 없음)` |
| **T=2.4s** | (앱 서버 여전히 멈춰있음) | | **4. 할 일이 없으므로 작업 종료 또는 재시도 로직 대기** | `(아무것도 없음)` |

#### 왜 문제가 해결되는가? - "Commit의 힘"

위 시나리오에서 가장 중요한 것은 **T=2.2초**에 폴링 서버가 DB를 조회했을 때의 결과입니다.

*   **앱 서버의 상태:** 앱 서버는 **T=1.0초**에 트랜잭션을 쏘고 나서 멈췄습니다. 그래서 `txHash`를 받아오는 로직, `txHash`를 업데이트하는 로직, 그리고 가장 중요한 **`queryRunner.commitTransaction()`**을 **실행하지 못했습니다.**

*   **DB의 상태:** 데이터베이스의 관점에서 보면, 앱 서버는 트랜잭션을 시작(`startTransaction`)했지만, 최종 승인(`commit`)도, 취소(`rollback`)도 하지 않은 어정쩡한 상태로 연결이 끊겨버린 것입니다. 대부분의 데이터베이스 시스템(PostgreSQL, MySQL 등)은 이런 경우, 해당 트랜잭션을 **자동으로 롤백(Rollback)** 처리하여 트랜잭션 시작 전의 상태로 되돌립니다. 즉, **T=0.1초**에 임시로 만들었던 `Mileage` 레코드는 그냥 사라집니다.

*   **폴링 서버의 행동:** 폴링 서버는 이벤트에서 얻은 `txHash`('0x123...')를 가지고 신나게 DB에 "이 txHash를 가진 레코드 주세요!" 라고 요청합니다. 하지만 DB에는 그런 레코드가 존재하지 않습니다. 왜냐하면 앱 서버가 `commit`을 하지 못했기 때문입니다. 따라서 폴링 서버는 아무런 작업도 수행할 수 없습니다.

#### 폴링 서버의 보완 로직 (선택적이지만 권장)

이런 상황을 대비해 폴링 서버는 다음과 같은 보완 로직을 가질 수 있습니다.

> "이벤트는 왔는데, 해당하는 `txHash`의 레코드가 DB에 없네? 이건 앱 서버의 `commit`이 아직 안됐거나 실패한 경우일 수 있으니, 몇 초(분) 뒤에 다시 조회해봐야겠다."

이런 재시도(Retry) 로직을 추가하면, 나중에 앱 서버의 부하가 풀려 `commit`이 되거나, 타임아웃으로 트랜잭션이 롤백되더라도 시스템은 안정적으로 상태를 따라갈 수 있습니다.

#### 결론

질문하신 대로, **"트랜잭션 전송"과 "이벤트 감지" 사이의 시간 차를 이용한 레이스 컨디션은 여전히 발생할 수 있습니다.**

하지만 `TransactionHandler` 구조는, 설령 그런 레이스 컨디션이 발생하더라도 **폴링 서버가 DB에서 데이터를 찾지 못하게 만듦**으로써 데이터가 꼬이는 상황을 원천적으로 차단합니다. **`commit`이라는 행위가 앱 서버와 폴링 서버 간의 유일하고 안전한 '바통 터치' 지점**이 되기 때문입니다. 폴링 서버는 `commit`이라는 바통을 받기 전까지는 절대 출발할 수 없는 것입니다.

---

### **User:** 아 그러니까 기술적으로 막을수는 없는거고, 장치만을 마련하는거네?

### **AI:** 네, 맞습니다. **정확히 보셨습니다.**

**"기술적으로 (두 서버의 동작 시간 순서를) 막는 것이 아니라, 그 순서가 꼬이더라도 데이터가 절대 오염되지 않도록 보장하는 안전 장치를 마련하는 것"**

이것이 제가 제안드린 아키텍처의 핵심 철학입니다. 그 표현이 이 상황을 가장 완벽하게 설명합니다.

우리는 분산 시스템(Distributed System) 환경에서 두 가지 사실을 통제할 수 없습니다.

1.  **네트워크 지연:** 앱 서버, DB 서버, 블록체인 노드 간의 통신 시간은 예측 불가능합니다.
2.  **독립적인 서버의 실행 속도:** 앱 서버의 부하와 폴링 서버의 부하는 서로에게 영향을 주지 않으며, 어느 쪽이 먼저 특정 작업을 완료할지 보장할 수 없습니다.

따라서 시간 순서를 "막으려고" 시도하는 것은 근본적으로 불가능하거나 매우 비효율적입니다.

대신, 우리는 **"순서가 어떻게 되든, 최종 결과는 항상 우리가 원하는 상태가 되도록 만들자"** 는 목표를 가집니다. 이것이 바로 `TransactionHandler`가 제공하는 '안전 장치'의 역할입니다.

#### 안전 장치의 작동 원리 (열쇠와 자물쇠 비유)

*   **앱 서버의 역할:** DB에 `commit`을 함으로써, 특정 `txHash`를 가진 **'자물쇠'**를 DB에 단단히 설치합니다.
*   **폴링 서버의 역할:** 블록체인에서 이벤트를 받아 `txHash`라는 **'열쇠'**를 손에 넣습니다.
*   **안전 장치:**
    *   만약 폴링 서버가 열쇠(이벤트)를 먼저 손에 넣었더라도, 앱 서버가 아직 자물쇠(DB 레코드)를 설치(`commit`)하지 않았다면, 열쇠는 아무 쓸모가 없습니다. 폴링 서버는 문을 열 수 없으니 그냥 돌아가거나, 자물쇠가 설치될 때까지 기다릴 수밖에 없습니다.
    *   앱 서버가 자물쇠를 성공적으로 설치(`commit`)한 이후라면, 폴링 서버는 언제 열쇠를 사용하든 항상 자물쇠를 열고 다음 작업을 수행할 수 있습니다.

이처럼 `commit`이라는 행위를 통해 **'자물쇠 설치'가 '열쇠 사용'의 절대적인 선행 조건이 되도록 강제**하는 것, 이것이 바로 우리가 마련한 '장치'의 실체입니다.

이러한 설계 방식은 외부 시스템 연동, 비동기 메시지 큐 처리 등 현대 백엔드 시스템에서 데이터 정합성을 지키기 위해 사용하는 매우 표준적이고 강력한 패턴입니다. 아주 중요한 포인트를 정확하게 짚어주셨습니다.

---

### **User:** 그럼 이러한 장치는 제안해준 QueryRunner등의 DB 직접 접근 메소드를 사용해야만 하는거야? 일반적인 API 구현방식으로는 어렵고?

### **AI:** 네, 그 부분도 매우 정확한 질문입니다. 일반적인 API 구현 방식으로는 왜 어려운지, 왜 `QueryRunner` 같은 직접적인 제어 도구가 필요한지 설명해 드리겠습니다.

**결론부터 말씀드리면, 네, 이 안전 장치는 `QueryRunner`와 같이 데이터베이스 트랜잭션을 직접 제어할 수 있는 방법을 사용해야만 구현할 수 있습니다.** 일반적인 API 구현 방식으로는 불가능하거나 훨씬 더 복잡하고 불안정해집니다.

#### "일반적인 API 구현 방식"의 한계

NestJS와 TypeORM에서 "일반적인 방식"은 `Repository`를 주입받아 `save()`, `update()`, `delete()` 등의 메소드를 직접 사용하는 것을 의미합니다.

```typescript
// 일반적인 방식의 예
await this.mileageRepository.save(newMileage);
```

이 방식의 가장 큰 특징은 **'자동 커밋(Auto-Commit)'**입니다. `await this.mileageRepository.save(newMileage);` 이 코드가 실행을 마치는 순간, TypeORM은 내부적으로 다음과 같은 일을 자동으로 수행합니다.

1.  트랜잭션 시작
2.  `INSERT` 쿼리 실행
3.  **즉시 트랜잭션 커밋**

각각의 `save`, `update` 호출이 그 자체로 하나의 완결된 트랜잭션입니다. **여러 개의 DB 작업과 외부 API 호출을 하나의 거대한 트랜잭션으로 묶을 수가 없습니다.**

#### 왜 일반적인 방식으로는 안전 장치를 만들 수 없는가?

만약 `QueryRunner` 없이 일반적인 방식으로 문제의 로직을 구현하려고 시도하면 다음과 같은 코드가 됩니다.

**[매우 나쁜 코드 예시 - 절대 이렇게 사용하면 안 됩니다]**

```typescript
// QueryRunner 없이 구현하려고 시도한 경우
async createMileage_BAD_EXAMPLE(createMileageDto, files) {
    // ... 파일 업로드 로직 ...

    // 1. DB에 마일리지 정보 저장 (⚠️ 이 순간 즉시 DB에 영구 저장됨)
    const savedMileage = await this.mileageRepository.save({
        ...createMileageDto,
        isConfirmed: false,
        transactionHash: null,
    });

    try {
        // 2. 블록체인에 트랜잭션 전송
        const txReceipt = await this.caverService.sendRawTransaction(createMileageDto.rawTransaction);
        const txHash = txReceipt.transactionHash;

        // 3. txHash를 업데이트 (⚠️ 이 역시 즉시 DB에 영구 저장됨)
        await this.mileageRepository.update(savedMileage.id, { transactionHash: txHash });

        savedMileage.transactionHash = txHash;
        return savedMileage;

    } catch (error) {
        // --- 💥 치명적인 문제 발생 지점 ---
        // 만약 2번 블록체인 전송이 실패했다면?
        // 1번에서 저장한 `savedMileage`는 이미 DB에 영구적으로 저장되어 있습니다.
        // 이 데이터를 '고아 데이터(Orphan Data)'라고 부릅니다.
        // 이 데이터를 지우려면 여기서 수동으로 삭제 코드를 호출해야 합니다.
        
        // 예: await this.mileageRepository.delete(savedMileage.id);
        
        // 하지만 만약 이 delete 호출마저 실패한다면?? 데이터는 영원히 꼬이게 됩니다.
        // 이것이 바로 데이터 정합성이 깨지는 순간입니다.
        throw new InternalServerErrorException("처리 실패");
    }
}
```

보시다시피, `catch` 블록에 도달했을 때는 이미 첫 번째 `save()` 작업이 되돌릴 수 없는 강을 건넌 상태입니다. 실패한 경우를 처리하기 위해 `delete` 코드를 추가하는 등 로직이 매우 복잡해지고, 그 보상 트랜잭션(삭제)마저 실패할 수 있어 완벽한 안정성을 보장할 수 없습니다.

#### `QueryRunner`의 존재 이유

`QueryRunner`는 바로 이 문제를 해결하기 위해 존재합니다. **'자동 커밋'을 비활성화하고, 개발자가 원하는 순간에 `commit` 또는 `rollback`을 할 수 있는 권한을 제공합니다.**

`QueryRunner`를 사용함으로써 우리는 다음과 같은 선언을 할 수 있게 됩니다.

> "지금부터 `startTransaction()` 과 `commitTransaction()` 사이에서 일어나는 모든 DB 작업과, 그 사이에 끼어있는 블록체인 전송 같은 외부 API 호출까지 전부 포함해서, 이 모든 것을 하나의 성공 또는 하나의 실패로 간주하겠다."

따라서, 외부 시스템 호출처럼 실패 가능성이 있는 작업을 데이터베이스 작업과 한 묶음으로 처리해야 하는 모든 경우에는, 반드시 `QueryRunner`와 같이 트랜잭션을 수동으로 제어할 수 있는 도구를 사용해야만 합니다.

---