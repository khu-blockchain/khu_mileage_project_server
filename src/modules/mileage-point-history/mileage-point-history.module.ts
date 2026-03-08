import { Module } from '@nestjs/common';

import { MileagePointHistoryController } from './mileage-point-history.controller';
import { MileagePointHistoryService } from './mileage-point-history.service';
import { MileagePointHistoryRepository } from './repository/mileage-point-history.repository';

@Module({
  controllers: [MileagePointHistoryController],
  providers: [MileagePointHistoryService, MileagePointHistoryRepository],
  exports: [MileagePointHistoryService],
})
export class MileagePointHistoryModule {}
