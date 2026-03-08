import { Module } from '@nestjs/common';

import { AppConfigModule } from '@/config/config.module';

import { KaiaService } from './kaia.service';

@Module({
  imports: [AppConfigModule],
  providers: [KaiaService],
  exports: [KaiaService],
})
export class KaiaModule {}
