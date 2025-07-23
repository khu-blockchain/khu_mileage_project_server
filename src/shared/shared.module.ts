import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { AppConfigModule } from '@/config/config.module';
import { AllExceptionsFilter } from '@/shared/filters/all-exceptions.filter';
import { LoggingInterceptor } from '@/shared/interceptors/logging.interceptor';
import { AppLoggerModule } from '@/shared/logger/logger.module';

@Module({
  imports: [AppLoggerModule, AppConfigModule],
  exports: [AppLoggerModule, AppConfigModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class SharedModule {}
