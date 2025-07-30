import { Module } from '@nestjs/common';

import { KaiaModule } from '@/modules/kaia/kaia.module';
import { StudentModule } from '@/modules/student/student.module';

import { WalletLostRepository } from './repository/wallet-lost.repository';
import { WalletLostController } from './wallet-lost.controller';
import { WalletLostService } from './wallet-lost.service';

@Module({
  imports: [StudentModule, KaiaModule],
  controllers: [WalletLostController],
  providers: [WalletLostService, WalletLostRepository],
  exports: [WalletLostService],
})
export class WalletLostModule {}
