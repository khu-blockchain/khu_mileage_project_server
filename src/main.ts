import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { initializeTransactionalContext } from 'typeorm-transactional';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

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
bootstrap();
