# SW Mileage Server API Documentation

클라이언트 개발자를 위한 API 명세서입니다.

## 공통 응답 형식

모든 API는 다음과 같은 공통 응답 형식을 사용합니다:

```json
{
  "data": {}, // 실제 데이터
  "meta": {   // 메타데이터 (페이지네이션 등)
    "total": number,
    "lastPage": number
  }
}
```

## 인증

JWT 토큰을 사용한 Bearer 인증을 사용합니다. 로그인 시 쿠키로 refresh token이 설정됩니다.

### Authorization Header
```
Authorization: Bearer <access_token>
```

## 1. 관리자 (Admin) API

### 1.1 관리자 계정 생성
- **경로**: `POST /admin`
- **인증**: 불필요
- **Body**:
```json
{
  "adminId": "string",           // 필수, 관리자 ID
  "name": "string",              // 필수, 이름
  "password": "string",          // 필수, 비밀번호
  "passwordConfirm": "string",   // 필수, 비밀번호 확인
  "email": "string",             // 필수, 이메일 형식
  "walletAddress": "string"      // 필수, 이더리움 주소 형식
}
```
- **응답**:
```json
{
  "data": {
    "admin_id": "string",
    "name": "string",
    "email": "string",
    "wallet_address": "string",
    "transaction_status": "PROCESSING|CONFIRMED|FAILED",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 1.2 관리자 이메일 수정
- **경로**: `PUT /admin/email`
- **인증**: 필수 (ADMIN 권한)
- **Body**:
```json
{
  "email": "string"  // 필수, 새로운 이메일
}
```
- **응답**: 관리자 정보 객체

---

## 2. 인증 (Auth) API

### 2.1 학생 로그인
- **경로**: `POST /auth/login/student`
- **인증**: 불필요
- **Body**:
```json
{
  "studentId": "string",  // 필수, 학번
  "password": "string"    // 필수, 비밀번호
}
```
- **응답**:
```json
{
  "data": {
    // 학생 정보 + 토큰 정보
    "id": "string",
    "name": "string",
    "department": "string",
    "wallet_address": "string",
    "access_token": {
      "token": "string",
      "expires_in": number
    },
    "refresh_token": {
      "token": "string",
      "expires_in": number
    }
  }
}
```

### 2.2 관리자 로그인
- **경로**: `POST /auth/login/admin`
- **인증**: 불필요
- **Body**:
```json
{
  "adminId": "string",   // 필수, 관리자 ID
  "password": "string"   // 필수, 비밀번호
}
```
- **응답**: 관리자 정보 + 토큰 정보

### 2.3 토큰 갱신
- **경로**: `POST /auth/refresh`
- **인증**: 필수 (Refresh Token)
- **Body**: 없음
- **응답**: 새로운 토큰 정보

---

## 3. 학생 (Student) API

### 3.1 학생 계정 생성
- **경로**: `POST /student`
- **인증**: 불필요
- **Body**:
```json
{
  "studentId": "string",                      // 필수, 학번
  "password": "string",                       // 필수, 비밀번호
  "passwordConfirm": "string",                // 필수, 비밀번호 확인
  "name": "string",                          // 필수, 이름
  "department": "string",                    // 필수, 학과
  "email": "string",                         // 필수, 이메일
  "bankAccountNumber": "string",             // 필수, 계좌번호
  "bankCode": "string",                      // 필수, 은행코드
  "personalInformationConsentStatus": boolean, // 필수, 개인정보 동의
  "walletAddress": "string",                 // 필수, 지갑 주소
  "studentHash": "string",                   // 필수, 학생 해시
  "rawTransaction": "string"                 // 필수, Raw Transaction
}
```

### 3.2 내 정보 조회
- **경로**: `GET /student/me`
- **인증**: 필수 (STUDENT 권한)
- **응답**: 학생 정보 객체

### 3.3 학생 목록 조회 (관리자용)
- **경로**: `GET /student`
- **인증**: 필수 (ADMIN 권한)
- **Query Parameters**:
  - `limit`: number (선택, 기본값: 100)
  - `page`: number (선택, 기본값: 1)
  - `studentId`: string (선택, 학번 필터)
  - `name`: string (선택, 이름 필터)

### 3.4 특정 학생 조회 (관리자용)
- **경로**: `GET /student/:studentId`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `studentId`: string - 조회할 학번

### 3.5 지갑 변경 요청 생성
- **경로**: `POST /student/wallet-change/create`
- **인증**: 필수 (STUDENT 권한)
- **Body**:
```json
{
  "rawTransaction": "string"  // 필수, Raw Transaction
}
```

### 3.6 지갑 변경 확인
- **경로**: `POST /student/wallet-change/confirm`
- **인증**: 필수 (STUDENT 권한)
- **Body**:
```json
{
  "rawTransaction": "string"  // 필수, Raw Transaction
}
```

---

## 4. 마일리지 (Mileage) API

### 4.1 마일리지 신청
- **경로**: `POST /mileage`
- **인증**: 필수 (STUDENT 권한)
- **Content-Type**: `multipart/form-data`
- **Body**:
```json
{
  "studentId": "string",            // 필수, 학번
  "mileageActivityId": "string",    // 필수, 마일리지 활동 ID
  "mileageCategoryName": "string",  // 필수, 마일리지 카테고리명
  "mileageDescription": "string",   // 필수, 마일리지 설명
  "docHash": "string",              // 필수, 문서 해시
  "rawTransaction": "string"        // 필수, Raw Transaction
}
```
- **Files**: `mileageFiles[]` - 첨부 파일들

### 4.2 내 마일리지 조회
- **경로**: `GET /mileage/my`
- **인증**: 필수 (STUDENT 권한)
- **응답**: 마일리지 목록

### 4.3 마일리지 목록 조회 (관리자용)
- **경로**: `GET /mileage`
- **인증**: 필수 (ADMIN 권한)
- **Query Parameters**:
  - `limit`: number (선택, 기본값: 100)
  - `page`: number (선택, 기본값: 1)
  - `studentId`: string (선택, 학번 필터)
  - `status`: "REVIEWING|REJECTED|APPROVED" (선택, 상태 필터)

### 4.4 마일리지 상세 조회
- **경로**: `GET /mileage/:id`
- **인증**: 필수 (ADMIN 또는 STUDENT 권한)
- **Path Parameters**:
  - `id`: number - 마일리지 ID
- **응답**:
```json
{
  "data": {
    "id": number,
    "mileage_category_name": "string",
    "mileage_activity_name": "string",
    "mileage_description": "string",
    "admin_comment": "string|null",
    "doc_index": "number|null",
    "doc_hash": "string|null",
    "status": "REVIEWING|REJECTED|APPROVED",
    "transaction_status": "PROCESSING|CONFIRMED|FAILED",
    "created_at": "string",
    "updated_at": "string",
    "student": {},
    "mileage_files": []
  }
}
```

### 4.5 마일리지 승인
- **경로**: `POST /mileage/:id/approve`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 마일리지 ID
- **Body**:
```json
{
  "mileagePoint": number,        // 필수, 승인할 마일리지 점수
  "rawTransaction": "string"     // 필수, Raw Transaction
}
```

### 4.6 마일리지 거부
- **경로**: `POST /mileage/:id/reject`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 마일리지 ID
- **Body**:
```json
{
  "adminComment": "string",      // 필수, 거부 사유
  "rawTransaction": "string"     // 필수, Raw Transaction
}
```

### 4.7 마일리지 민팅
- **경로**: `POST /mileage/:id/mint`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 마일리지 ID
- **Body**:
```json
{
  "mileagePoint": number,    // 필수, 민팅할 마일리지 점수
  "note": "string",          // 선택, 메모
  "rawTransaction": "string" // 필수, Raw Transaction
}
```

### 4.8 마일리지 소각
- **경로**: `POST /mileage/:id/burn`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 마일리지 ID
- **Body**:
```json
{
  "mileagePoint": number,    // 필수, 소각할 마일리지 점수
  "note": "string",          // 선택, 메모
  "rawTransaction": "string" // 필수, Raw Transaction
}
```

---

## 5. 마일리지 루브릭 (Mileage Rubric) API

### 5.1 마일리지 카테고리 생성
- **경로**: `POST /mileage-rubric/category`
- **인증**: 필수 (ADMIN 권한)
- **Body**:
```json
{
  "name": "string",        // 필수, 카테고리명
  "description": "string"  // 필수, 설명
}
```

### 5.2 마일리지 활동 생성
- **경로**: `POST /mileage-rubric/activity`
- **인증**: 필수 (ADMIN 권한)
- **Body**:
```json
{
  "mileageCategoryId": number,        // 필수, 카테고리 ID
  "name": "string",                   // 필수, 활동명
  "pointType": "FIXED|OPTIONAL",      // 필수, 점수 타입
  "pointDescription": "string",       // 필수, 점수 설명
  "fixedPoint": number                // 선택, 고정 점수 (pointType이 FIXED일 때)
}
```

### 5.3 마일리지 카테고리 수정
- **경로**: `PATCH /mileage-rubric/category/:id`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 카테고리 ID
- **Body**: 카테고리 생성과 동일

### 5.4 마일리지 활동 수정
- **경로**: `PATCH /mileage-rubric/activity/:id`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 활동 ID
- **Body**: 활동 생성과 동일

### 5.5 마일리지 카테고리 삭제
- **경로**: `DELETE /mileage-rubric/category/:id`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 카테고리 ID

### 5.6 마일리지 활동 삭제
- **경로**: `DELETE /mileage-rubric/activity/:id`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 활동 ID

### 5.7 마일리지 루브릭 전체 조회
- **경로**: `GET /mileage-rubric`
- **인증**: 불필요
- **응답**:
```json
{
  "data": [
    {
      "id": number,
      "name": "string",
      "description": "string",
      "created_at": "string",
      "updated_at": "string",
      "mileage_activities": [
        {
          "id": number,
          "name": "string",
          "point_type": "FIXED|OPTIONAL",
          "point_description": "string",
          "fixed_point": "number|null"
        }
      ]
    }
  ]
}
```

---

## 6. 마일리지 토큰 (Mileage Token) API

### 6.1 마일리지 토큰 생성
- **경로**: `POST /mileage-token`
- **인증**: 필수 (ADMIN 권한)
- **Body**:
```json
{
  "name": "string",              // 필수, 토큰명
  "description": "string",       // 필수, 설명
  "symbol": "string",            // 필수, 심볼
  "image_url": "string",         // 필수, 이미지 URL
  "raw_transaction": "string"    // 필수, Raw Transaction
}
```

### 6.2 마일리지 토큰 목록 조회
- **경로**: `GET /mileage-token`
- **인증**: 필수 (ADMIN 권한)
- **응답**: 마일리지 토큰 목록

### 6.3 마일리지 토큰 활성화
- **경로**: `POST /mileage-token/:id/activate`
- **인증**: 필수 (ADMIN 권한)
- **Path Parameters**:
  - `id`: number - 토큰 ID
- **Body**:
```json
{
  "raw_transaction": "string"  // 필수, Raw Transaction
}
```

### 6.4 컨트랙트 주소로 토큰 조회
- **경로**: `GET /mileage-token/:contractAddress`
- **인증**: 불필요
- **Path Parameters**:
  - `contractAddress`: string - 컨트랙트 주소 (Hex 형식)
- **응답**:
```json
{
  "data": {
    "id": number,
    "name": "string",
    "description": "string",
    "contract_address": "string",
    "symbol": "string",
    "image_url": "string",
    "transaction_status": "PROCESSING|CONFIRMED|FAILED",
    "transaction_hash": "string",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

---

## 7. 지갑 분실 (Wallet Lost) API

### 7.1 지갑 분실 신고
- **경로**: `POST /wallet-lost`
- **인증**: 필수 (STUDENT 권한)
- **Body**:
```json
{
  "targetAddress": "string"  // 필수, 새로운 지갑 주소
}
```

### 7.2 대기 중인 지갑 분실 신고 확인
- **경로**: `GET /wallet-lost/check`
- **인증**: 필수 (STUDENT 권한)
- **응답**:
```json
{
  "result": boolean,
  "data": {
    "id": number,
    "student_id": "string",
    "student_name": "string",
    "previous_wallet_address": "string",
    "request_wallet_address": "string",
    "created_at": "string",
    "updated_at": "string"
  } | null
}
```

### 7.3 지갑 분실 신고 목록 조회 (관리자용)
- **경로**: `GET /wallet-lost`
- **인증**: 필수 (ADMIN 권한)
- **Query Parameters**:
  - `limit`: number (선택, 기본값: 100)
  - `page`: number (선택, 기본값: 1)
  - `studentId`: string (선택, 학번 필터)

### 7.4 지갑 분실 신고 승인
- **경로**: `POST /wallet-lost/approve`
- **인증**: 필수 (ADMIN 권한)
- **Body**:
```json
{
  "id": number,              // 필수, 지갑 분실 신고 ID
  "rawTransaction": "string" // 필수, Raw Transaction
}
```

---

## 8. 마일리지 포인트 히스토리 (Mileage Point History) API

### 8.1 마일리지 포인트 히스토리 조회
- **경로**: `GET /mileage-point-history`
- **인증**: 불필요 (현재 구현되지 않음)
- **Query Parameters**:
  - `limit`: number (선택, 기본값: 100)
  - `page`: number (선택, 기본값: 1)
  - `mileageId`: number (선택, 마일리지 ID 필터)
  - `mileageTokenName`: string (선택, 토큰명 필터)
  - `studentId`: string (선택, 학번 필터)
- **응답**:
```json
{
  "data": [
    {
      "id": number,
      "mileage_token_name": "string",
      "mileage_activity_name": "string",
      "mileage_category_name": "string",
      "mileage_point": number,
      "transaction_hash": "string",
      "transaction_status": "PROCESSING|CONFIRMED|FAILED",
      "note": "string",
      "student_id": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "meta": {
    "total": number,
    "lastPage": number
  }
}
```

---

## 에러 응답

모든 API에서 에러 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "statusCode": number,
  "message": "string" | ["string"],
  "error": "string"
}
```

## 상태 코드

- `200`: 성공
- `201`: 생성 성공
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 에러

## 주요 ENUM 값

### TRANSACTION_STATUS
- `PROCESSING`: 처리 중
- `CONFIRMED`: 확인됨
- `FAILED`: 실패

### MILEAGE_STATUS
- `REVIEWING`: 검토 중
- `REJECTED`: 거부됨
- `APPROVED`: 승인됨

### POINT_TYPE
- `FIXED`: 고정 점수
- `OPTIONAL`: 가변 점수

### MILEAGE_POINT_HISTORY_TYPE
- `MILEAGE_APPROVED`: 마일리지 승인
- `MILEAGE_MINTED`: 마일리지 민팅
- `MILEAGE_BURNED`: 마일리지 소각

### WALLET_LOST_STATUS
- `CREATED`: 생성됨
- `APPROVED`: 승인됨

## 참고사항

1. 모든 블록체인 관련 작업은 `rawTransaction` 필드를 통해 처리됩니다.
2. 파일 업로드가 필요한 API는 `multipart/form-data` 형식을 사용합니다.
3. 페이지네이션은 `limit`(기본값: 100)과 `page`(기본값: 1) 파라미터를 사용합니다.
4. 모든 날짜는 ISO 8601 형식으로 반환됩니다.
5. 지갑 주소는 이더리움 주소 형식을 따릅니다.