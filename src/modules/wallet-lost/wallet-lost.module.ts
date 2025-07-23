import { Module } from '@nestjs/common';
import { WalletLostService } from './wallet-lost.service';
import { WalletLostController } from './wallet-lost.controller';
import { StudentModule } from '@/modules/student/student.module';
import { KaiaModule } from '@/modules/kaia/kaia.module';
import { WalletLostRepository } from './repository/wallet-lost.repository';

@Module({
  imports: [StudentModule, KaiaModule],
  controllers: [WalletLostController],
  providers: [WalletLostService, WalletLostRepository],
  exports: [WalletLostService],
})
export class WalletLostModule {}
