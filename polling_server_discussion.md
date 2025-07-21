# 폴링 서버 구축 및 마이그레이션 논의

이 문서는 NestJS 프로젝트 내에서 폴링 서버를 구축하고, 기존의 레거시 폴링 서버 코드를 마이그레이션하는 과정에 대한 논의를 정리한 것입니다.

---

### Q1: 폴링 서버, 현재 프로젝트에 추가할까요, 별도로 만들까요?

> 만약 폴링 서버를 개발한다면, 이 프로젝트에 추가하는게 좋을까 별도의 프로젝트를 만드는게 좋을까? entity와 service, controller 등 사용하는 메소드가 동일하지만 하나의 서버에서 polling을 처리하면 부하가 심할 것 같아서 분리하는게 나을것 같은데, 구현은 이 프로젝트에서 하고 배포 및 운영 시 별도로 실행되도록 할 수 있나?

**A: 하나의 프로젝트에서 구현하고, 별도의 프로세스로 실행하는 것을 권장합니다.**

이 접근 방식은 다음과 같은 장점이 있습니다.

-   **코드 중복 방지**: `Entity`, `Service`, `Repository` 등 핵심 비즈니스 로직을 API 서버와 폴링 서버가 공유하여 유지보수가 용이해집니다.
-   **개발 편의성**: 하나의 코드베이스에서 일관되게 개발을 진행할 수 있습니다.
-   **운영 유연성**: API 서버와 폴링 서버를 독립된 프로세스로 실행하여 리소스를 분리하고, 필요에 따라 폴링 서버만 독립적으로 스케일링할 수 있습니다.

#### NestJS에서 구현하는 방법

1.  **폴링 전용 모듈 및 서비스 생성**: 폴링 로직을 담당할 모듈을 만듭니다.
2.  **별도의 진입점(Entrypoint) 파일 생성**: API 서버용 `src/main.ts`와 별개로, 폴링 서버만을 위한 `src/poller.ts` 진입점 파일을 만듭니다. 이 파일에서는 웹 서버 기능 없이 NestJS의 DI 컨테이너만 로드하는 `NestFactory.createApplicationContext()` 함수를 사용합니다.

    ```typescript
    // src/poller.ts 예시
    import { NestFactory } from '@nestjs/core';
    import { AppModule } from './app.module';
    import { PollingService } from './modules/polling/polling.service'; 

    async function bootstrap() {
      console.log('Initializing polling application...');
      const app = await NestFactory.createApplicationContext(AppModule);
      const pollingService = app.get(PollingService);
      
      await pollingService.start(); 
      console.log('Polling process started.');
    }
    bootstrap();
    ```
3.  **`package.json`에 실행 스크립트 추가**: 폴링 서버를 실행하기 위한 별도 스크립트를 추가합니다.
    ```json
    "scripts": {
      "start:prod": "node dist/src/main",
      "start:poller": "node dist/src/poller"
    }
    ```

---

### Q2: 폴링 서버는 왜 웹 서버로 구동하지 않나요?

> 만약 polling server는 왜 웹 서버로 구동하지 않도록 한거고, 만약 일반적인 서버 처럼 실행된다면 어떻게 구현해야해?

**A: "필요 없는 기능은 켜지 않기 위함"이 핵심 이유입니다.**

-   **자원 효율성**: 폴링 서버는 외부 요청을 받을 필요가 없으므로, HTTP 요청을 수신 대기하는 데 사용되는 CPU, 메모리 자원을 절약할 수 있습니다.
-   **보안**: 외부 네트워크에 포트를 노출하지 않으므로, 불필요한 공격 표면(Attack Surface)을 만들지 않아 더 안전합니다.

#### 일반 웹 서버처럼 구동하는 방법

물론 웹 서버 프로세스 내에서 백그라운드 작업을 실행할 수도 있습니다. 이 경우 **`@nestjs/schedule`** 모듈을 사용하는 것이 가장 일반적입니다.

1.  **`ScheduleModule` 등록**: `AppModule`에 `ScheduleModule.forRoot()`를 추가합니다.
2.  **서비스에 스케줄 등록**: `@Cron` 또는 `@Interval` 데코레이터를 사용하여 폴링 로직을 담은 메소드를 주기적으로 실행하도록 설정합니다.
    ```typescript
    // src/modules/polling/polling.service.ts 예시
    import { Injectable, Logger } from '@nestjs/common';
    import { Cron, CronExpression } from '@nestjs/schedule';

    @Injectable()
    export class PollingService {
      private readonly logger = new Logger(PollingService.name);

      @Cron(CronExpression.EVERY_30_SECONDS)
      handleCron() {
        this.logger.debug('Polling task is running...');
        // 폴링 비즈니스 로직 구현
      }
    }
    ```
3.  **실행**: 별도의 진입점 없이, 기존 API 서버(`npm run start:prod`)를 실행하면 NestJS가 알아서 스케줄링된 작업을 함께 실행합니다.

---

### Q3: 레거시 폴링 서버 코드는 어떻게 마이그레이션하나요?

> @/poller_legacy 이 폴더 내부에 존재하는 코드가 과거에 구현했던 polling server 라면, 이 프로젝트로 어떻게 마이그레이션 하는게 좋을지 분석해줘

**A: 레거시 코드의 비즈니스 로직을 재사용하되, 전체 구조는 NestJS 아키텍처에 맞게 재구성합니다.**

#### 단계별 마이그레이션 계획

1.  **폴링 모듈 생성**: `nest g module modules/polling`으로 폴링 기능의 독립적인 공간을 만듭니다.
2.  **데이터베이스 및 모델 통합**: 레거시의 DB 모델(Sequelize 등)을 현재 프로젝트의 TypeORM `Entity`로 변환하고, `TypeOrmModule.forFeature()`를 통해 `Repository`를 주입받아 사용하도록 변경합니다.
3.  **설정(Configuration) 통합**: 레거시의 설정 값들을 NestJS의 `.env`와 `ConfigService` 방식으로 통합합니다.
4.  **핵심 로직 이전 및 리팩토링**: `poller_legacy/polling/`의 핵심 로직을 `PollingService`로 옮기면서 TypeScript로 변환하고, DB 쿼리는 TypeORM Repository를 사용하도록 수정합니다.
5.  **폴러(Poller) 진입점 생성**: 위에서 설명한 `src/poller.ts` 파일을 생성하고 `package.json`에 스크립트를 추가합니다.
6.  **소켓(Socket) 기능 마이그레이션**: 필요시, 소켓 관련 코드는 `@nestjs/websockets`의 `Gateway`로 구현합니다.

---

### Q4: 제공된 레거시 코드를 기반으로 상세 마이그레이션 전략을 알려주세요.

> 데이터베이스는 @/src 에서 사용하는 데이터베이스와 동일하다고 가정하고, @index.js @index.js @contract.js @index.contracts.js @eventHandler.js @index.js 이 부분들이 핵심 코드들이야

**A: 레거시 코드는 실시간 감지(WebSocket)와 확정 폴링(HTTP)을 결합한 견고한 하이브리드 방식입니다. 이 구조를 계승하여 마이그레이션합니다.**

1.  **`PollingService`에 핵심 로직 구현**:
    -   `onModuleInit` 생명주기 훅을 사용하여 `ethers.WebSocketProvider` 연결 및 이벤트 리스너 등록 로직을 구현합니다. (`legacy/socket/index.contracts.js`의 실시간 감지 부분)
    -   `@nestjs/schedule`의 `@Cron`을 사용하여 `setInterval`로 구현된 확정 폴링 로직을 대체합니다.

2.  **`EventHandler` 로직 분리 및 마이그레이션**:
    -   `legacy/socket/eventHandler.js`의 각 이벤트 처리 로직을 `PollingService`가 직접 처리하는 대신, **관련 비즈니스 서비스로 위임**합니다.
    -   예를 들어, `DocApproved` 이벤트는 `PollingService`가 받아서 `MileageService`의 `handleDocApprovedEvent` 메소드를 호출하는 방식으로 변경합니다. 이는 코드의 관심사 분리(SoC) 원칙에 부합합니다.

3.  **`EventLog` 엔티티 생성**:
    -   폴링 서버의 작업 내역(수신된 이벤트, 처리 상태 등)을 추적하기 위한 `EventLog` 엔티티를 TypeORM으로 생성하여 데이터베이스 무결성과 추적 가능성을 높입니다.

    ```typescript
    // src/modules/polling/entities/event-log.entity.ts 예시
    @Entity('event_logs')
    export class EventLog {
      // ... id, txHash, logIndex, blockNumber, eventName, data, status
    }
    ```

4.  **폴러 진입점 (`poller.ts`) 설정**:
    -   `createApplicationContext()`를 사용하여 DI 컨테이너만 생성하고, NestJS가 `PollingService`의 `onModuleInit`과 `@Cron`을 자동으로 실행하도록 합니다.

---

### Q5: "애플리케이션 컨텍스트만 생성한다"는 말의 의미가 무엇인가요?

> 애플리케이션 컨텍스트만 생성하는게 어떤 의미라고 했는지 더 자세하게 알려줘

**A: NestJS의 핵심 기능만 활성화하고, 불필요한 웹 서버 기능은 끄는 것을 의미합니다.**

-   **`NestFactory.create()` (일반 웹 서버)**:
    1.  **의존성 주입(DI) 컨테이너 생성**: 모든 모듈, 서비스, 리포지토리 등을 초기화하고 서로 연결합니다.
    2.  **HTTP 서버 실행**: Express/Fastify를 띄우고, **네트워크 포트를 열어** 외부 요청을 받을 준비를 합니다.
    > 비유: 손님을 받을 홀과 정문까지 갖춘 **'레스토랑 전체 개업'**

-   **`NestFactory.createApplicationContext()` (컨텍스트만 생성)**:
    1.  **의존성 주입(DI) 컨테이너 생성**: `create()`와 동일하게 모든 서비스와 비즈니스 로직을 사용할 수 있도록 준비합니다.
    2.  **(수행 안 함)** HTTP 서버를 생성하거나 네트워크 포트를 열지 않습니다.
    > 비유: 외부 손님은 받지 않고, 정해진 스케줄에 따라 요리만 하는 **'주방만 임대하여 가동'**

폴링 서버는 외부 요청을 받을 필요가 없으므로, 애플리케이션 컨텍스트만 생성하는 것이 **자원 효율성**과 **보안** 측면에서 훨씬 유리합니다. 