# KHU Mileage Project Server

## 개요

경희대학교 SW 마일리지 백엔드 서버. NestJS 기반, Kaia 블록체인(Kairos 테스트넷) 수수료 위임 트랜잭션 처리.

## Tech Stack

- NestJS 11 + TypeScript 5.7
- ORM: TypeORM 0.3 + typeorm-transactional
- DB: PostgreSQL
- 인증: Passport + JWT (RS256)
- 블록체인: @kaiachain/viem-ext + viem
- 이메일: Nodemailer (@nestjs-modules/mailer)
- 로깅: Winston
- 보안: Helmet, bcrypt, cookie-parser
- 패키지 매니저: npm

## 듀얼 엔트리 아키텍처

`APP_TYPE` 환경 변수로 모드 결정:
- `main` (기본): HTTP API 서버 (`src/main.ts`)
- `poller`: 백그라운드 이벤트 폴링 서비스 (`src/poller.ts`, HTTP 리스닝 없음)

## 프로젝트 구조

```
src/
├── main.ts / poller.ts       # 듀얼 엔트리포인트
├── app.module.ts             # APP_TYPE에 따른 조건부 모듈 로딩
├── config/                   # configuration.ts, module-options.ts (Joi 검증)
├── shared/                   # filters, interceptors, validators, DTOs, logger
└── modules/
    ├── auth/                 # JWT RS256, Passport, 가드, 전략
    ├── student/              # 학생 CRUD, 지갑 변경
    ├── admin/                # 관리자 CRUD
    ├── mileage/              # 마일리지 신청/승인/거절/민트/번
    ├── mileage-rubric/       # 활동 카테고리/항목 관리
    ├── mileage-token/        # 토큰 생성/활성화/일시정지
    ├── mileage-point-history/ # 포인트 이력
    ├── wallet-lost/          # 지갑 분실 신고/복구
    ├── kaia/                 # 블록체인 서비스 (수수료 위임, Tx 검증)
    ├── polling/              # 컨트랙트 이벤트 폴링 (5초 주기 cron)
    ├── mail/                 # 이메일 알림
    └── file/                 # 파일 업로드 (Multer)
```

## 주요 스크립트

```bash
npm run start:dev           # HTTP 서버 (watch)
npm run start:poller:dev    # 폴러 (watch)
npm run start:prod          # 프로덕션 HTTP
npm run start:poller:prod   # 프로덕션 폴러
npm run build               # TypeScript 컴파일
npm run migration:run       # DB 마이그레이션 적용
npm run migration:revert    # 마이그레이션 롤백
npm run migration:init      # 엔티티에서 마이그레이션 생성
```

## Import 별칭

`@/*` → `./src/*`

## API 엔드포인트 (base: `/api/v1`)

| 모듈 | 경로 | 주요 기능 |
|------|------|----------|
| auth | `/auth` | login/student, login/admin, refresh, logout |
| student | `/student` | CRUD, /me, wallet-change/create·confirm |
| admin | `/admin` | 등록, 이메일 수정 |
| mileage | `/mileage` | 신청, 조회, /my, approve, reject, mint, burn |
| mileage-rubric | `/mileage-rubric` | category·activity CRUD |
| mileage-token | `/mileage-token` | 생성, 활성화, pause/unpause |
| mileage-point-history | `/mileage-point-history` | 이력 조회 |
| wallet-lost | `/wallet-lost` | 신고, check, approve |
| mail | `/mail` | 테스트 엔드포인트 |

## 인증

- JWT RS256 (비대칭 키, Base64 인코딩 .env)
- Access Token: 1시간, Authorization 헤더
- Refresh Token: 2시간, HTTP-only 쿠키 (`khu-sw-mileage-refresh`)
- 비밀번호: bcrypt 해싱
- 가드: `JwtAuthGuard`, `JwtRefreshGuard`, `RolesGuard`
- 데코레이터: `@CurrentUser()`, `@Roles(Role.ADMIN | Role.STUDENT)`

## 블록체인 통합 (modules/kaia)

### KaiaService 주요 메서드

| 메서드 | 용도 |
|--------|------|
| `sendTransactionWithFeePayerSign(rawTx)` | 수수료 대납 서명 + 브로드캐스트 |
| `calcTxHashFromRawTransaction(rawTx)` | Tx 해시 사전 계산 |
| `validateStudentManagerTransaction(rawTx, ...)` | 보낸 사람, 컨트랙트, 함수, 인자 검증 |
| `getActiveMileageTokenAddress()` | 활성 토큰 주소 조회 |
| `addAdmin(walletAddress)` | 온체인 관리자 추가 |

### 폴링 서비스

- 5초 주기 cron으로 StudentManager 컨트랙트 이벤트 폴링
- 3개 RPC fallback 엔드포인트
- EventLog, Block 엔티티로 이벤트 추적

## 데이터베이스

- PostgreSQL + TypeORM
- `synchronize: false` → 마이그레이션 기반
- 현재 마이그레이션: `1757569503974-init.ts`
- 엔티티: Student, Admin, Mileage, MileageFile, MileageCategory, MileageActivity, MileagePointHistory, MileageToken, WalletLost, EventLog, Block

## 환경 변수

```
# 앱
APP_ENV, APP_PORT, APP_TYPE, CORS_ORIGIN, PUBLIC_FILE_URL

# DB
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS

# JWT (RS256)
JWT_PUBLIC_KEY_BASE64, JWT_PRIVATE_KEY_BASE64
JWT_ACCESS_TOKEN_EXP_IN_SEC, JWT_REFRESH_TOKEN_EXP_IN_SEC

# Kaia
FEE_PAYER_PRIVATE_KEY, FEE_PAYER_ADDRESS
KAIROS_CHAIN_ID, KAIROS_RPC_URL
STUDENT_MANAGER_CONTRACT_ADDRESS

# 메일
MAIL_HOST, MAIL_USER, MAIL_PASSWORD, MAIL_SENDER, ADMIN_EMAIL
```

Joi 스키마로 검증 (`config/module-options.ts`)

## CD

`.github/workflows/deploy.yml`: main push 시 SSH → git pull → docker-compose build
- 현재 SSH 포트 플레이스홀더(`<포트번호>`)로 비활성 상태

## 테스트

Jest 29 + ts-jest 설정됨, 테스트 파일 미작성
```bash
npm test              # 단위 테스트
npm run test:e2e      # E2E 테스트
```
