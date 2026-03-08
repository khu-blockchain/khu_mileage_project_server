import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionLog } from './entities/transaction-log.entity';
import { TransactionLogRepository } from './repository/transaction-log.repository';
import { TransactionLogService } from './transaction-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionLog])],
  providers: [TransactionLogService, TransactionLogRepository],
  exports: [TransactionLogService],
})
export class TransactionLogModule {}
