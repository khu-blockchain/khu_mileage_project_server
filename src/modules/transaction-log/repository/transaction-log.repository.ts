import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { TxLogDomain } from '../constants/tx-log-domain.enum';
import { TxLogStage } from '../constants/tx-log-stage.enum';
import { TransactionLog } from '../entities/transaction-log.entity';

export interface CreateTxLogParams {
  domain: TxLogDomain;
  domain_id: string;
  stage: TxLogStage;
  raw_transaction?: string;
  tx_hash?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class TransactionLogRepository extends Repository<TransactionLog> {
  constructor(private dataSource: DataSource) {
    super(TransactionLog, dataSource.createEntityManager());
  }

  async createLog(params: CreateTxLogParams): Promise<TransactionLog> {
    const log = this.create(params);
    return this.save(log);
  }
}
