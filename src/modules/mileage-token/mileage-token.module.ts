import { Module } from '@nestjs/common';
import { MileageTokenService } from './mileage-token.service';
import { MileageTokenController } from './mileage-token.controller';
import { KaiaModule } from '@/modules/kaia/kaia.module';
import { MileageTokenRepository } from './repository/mileage-token.repository';

@Module({
  imports: [KaiaModule],
  controllers: [MileageTokenController],
  providers: [MileageTokenService, MileageTokenRepository],
  exports: [MileageTokenService],
})
export class MileageTokenModule {}
