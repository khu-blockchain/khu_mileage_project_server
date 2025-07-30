import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from '@/config/config.module';

import { AdminModule } from '../admin/admin.module';
import { KaiaModule } from '../kaia/kaia.module';
import { MileageModule } from '../mileage/mileage.module';
import { MileagePointHistoryModule } from '../mileage-point-history/mileage-point-history.module';
import { StudentModule } from '../student/student.module';
import { WalletLostModule } from '../wallet-lost/wallet-lost.module';
import { Block } from './entities/block.entity';
import { EventLog } from './entities/event-log.entity';
import { EventService } from './event.service';
import { PollingService } from './polling.service';
import { BlockRepository } from './repository/block.repository';
import { EventLogRepository } from './repository/event-log.repository';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([EventLog, Block]),
    KaiaModule,
    AdminModule,
    StudentModule,
    MileageModule,
    MileagePointHistoryModule,
    WalletLostModule,
  ],
  providers: [PollingService, EventService, EventLogRepository, BlockRepository],
  exports: [PollingService],
})
export class PollingModule {}
