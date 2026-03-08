import { Module } from '@nestjs/common';

import { KaiaModule } from '@/modules/kaia/kaia.module';

import { MileageTokenController } from './mileage-token.controller';
import { MileageTokenService } from './mileage-token.service';
import { MileageTokenRepository } from './repository/mileage-token.repository';

@Module({
  imports: [KaiaModule],
  controllers: [MileageTokenController],
  providers: [MileageTokenService, MileageTokenRepository],
  exports: [MileageTokenService],
})
export class MileageTokenModule {}
