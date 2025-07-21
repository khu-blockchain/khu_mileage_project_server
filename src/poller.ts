import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { initializeTransactionalContext } from 'typeorm-transactional';

/**
 * @description
 * 폴링 서버를 위한 전용 진입점(Entrypoint) 파일입니다.
 * `main.ts`와 달리 `listen()`을 호출하지 않고,
 * `createApplicationContext()`를 사용하여 웹 서버를 띄우지 않습니다.
 * 이를 통해 불필요한 리소스 낭비를 막고 보안을 강화할 수 있습니다.
 */
async function bootstrap() {
  initializeTransactionalContext();
  // 웹 서버를 띄우지 않고 애플리케이션 컨텍스트만 생성
  await NestFactory.createApplicationContext(AppModule, {
    // 콘솔에 출력될 로그 레벨을 지정합니다.
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // NestFactory가 DI 컨테이너를 생성하면, PollingService의 `onModuleInit`과
  // `@Cron` 데코레이터가 붙은 메소드들이 자동으로 실행됩니다.
  // 따라서 여기서 명시적으로 PollingService의 메소드를 호출할 필요가 없습니다.
  // 이 프로세스는 애플리케이션 컨텍스트가 활성화된 상태로 계속 실행됩니다.
  console.log('Polling application context initialized. Poller is running.');
}

bootstrap().catch((err) => {
  console.error('Error starting polling application:', err);
  process.exit(1);
}); 