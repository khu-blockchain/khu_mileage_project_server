import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';

import { AppModule } from './app.module';

async function bootstrap() {
  initializeTransactionalContext();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'https://sw-mileage.com'],
    credentials: true,
  });

  app.use(helmet());
  app.use(cookieParser());
  // app.use(json({ limit: '50mb' }));

  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public',
  });

  await app.listen(port);
}
void bootstrap();
