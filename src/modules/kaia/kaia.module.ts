import { Module } from '@nestjs/common';
import { KaiaService } from './kaia.service';
import { AppConfigModule } from '@/config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [KaiaService],
  exports: [KaiaService],
})
export class KaiaModule {}
