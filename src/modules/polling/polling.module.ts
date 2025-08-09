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
import { MileageTokenService } from '../mileage-token/mileage-token.service';
import { MileageTokenModule } from '../mileage-token/mileage-token.module';
import { MileageTokenRepository } from '../mileage-token/repository/mileage-token.repository';

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
    MileageTokenModule,
  ],
  providers: [
    PollingService,
    EventService,
    MileageTokenService,
    EventLogRepository,
    BlockRepository,
    MileageTokenRepository,
  ],
  exports: [PollingService],
})
export class PollingModule {}
