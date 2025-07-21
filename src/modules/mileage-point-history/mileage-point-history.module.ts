import { Module } from '@nestjs/common';
import { MileagePointHistoryService } from './mileage-point-history.service';
import { MileagePointHistoryController } from './mileage-point-history.controller';
import { MileagePointHistoryRepository } from './repository/mileage-point-history.repository';

@Module({
  controllers: [MileagePointHistoryController],
  providers: [MileagePointHistoryService, MileagePointHistoryRepository],
  exports: [MileagePointHistoryService],
})
export class MileagePointHistoryModule {}
