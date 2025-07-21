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

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([EventLog, Block]),
    KaiaModule,
  ],
  providers: [PollingService, EventService, EventLogRepository, BlockRepository],
  exports: [PollingService],
})
export class PollingModule {}
