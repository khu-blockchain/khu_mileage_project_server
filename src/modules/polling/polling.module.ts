import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingService } from './polling.service';
import { EventLog } from './entities/event-log.entity';
import { EventLogRepository } from './repository/event-log.repository';
import { Block } from './entities/block.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { BlockRepository } from './repository/block.repository';
import { KaiaModule } from '../kaia/kaia.module';
import { AppConfigModule } from '@/config/config.module';
import { EventService } from './event.service';
import { AdminModule } from '../admin/admin.module';
import { StudentModule } from '../student/student.module';
import { MileageModule } from '../mileage/mileage.module';
import { MileagePointHistoryModule } from '../mileage-point-history/mileage-point-history.module';
import { WalletLostModule } from '../wallet-lost/wallet-lost.module';

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
