import { Module } from '@nestjs/common';
import { WalletLostService } from './wallet-lost.service';
import { WalletLostController } from './wallet-lost.controller';

@Module({
  controllers: [WalletLostController],
  providers: [WalletLostService],
})
export class WalletLostModule {}
