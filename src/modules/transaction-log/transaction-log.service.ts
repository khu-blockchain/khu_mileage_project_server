import { Injectable, Logger } from '@nestjs/common';

import { TxLogDomain } from './constants/tx-log-domain.enum';
import { TxLogStage } from './constants/tx-log-stage.enum';
import { TransactionLog } from './entities/transaction-log.entity';
import { TransactionLogRepository } from './repository/transaction-log.repository';

@Injectable()
export class TransactionLogService {
  private readonly logger = new Logger(TransactionLogService.name);

  constructor(
    private readonly transactionLogRepository: TransactionLogRepository,
  ) {}

  async log(
    domain: TxLogDomain,
    domainId: string,
    stage: TxLogStage,
    options?: {
      rawTransaction?: string;
      txHash?: string;
      errorMessage?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<TransactionLog | null> {
    try {
      return await this.transactionLogRepository.createLog({
        domain,
        domain_id: domainId,
        stage,
        raw_transaction: options?.rawTransaction,
        tx_hash: options?.txHash,
        error_message: options?.errorMessage,
        metadata: options?.metadata,
      });
    } catch (error) {
      // 로깅 실패가 비즈니스 로직을 중단시키면 안 됨
      this.logger.error(
        `Failed to write transaction log: domain=${domain}, domainId=${domainId}, stage=${stage}`,
        error,
      );
      return null;
    }
  }
}
