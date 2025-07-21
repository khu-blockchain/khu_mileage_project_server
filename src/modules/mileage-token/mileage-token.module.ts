import { Module } from '@nestjs/common';
import { MileageTokenService } from './mileage-token.service';
import { MileageTokenController } from './mileage-token.controller';

@Module({
  controllers: [MileageTokenController],
  providers: [MileageTokenService],
})
export class MileageTokenModule {}
