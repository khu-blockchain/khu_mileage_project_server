import { DataSource, Repository } from 'typeorm';
import { EventLog } from '../entities/event-log.entity';
import { Injectable } from '@nestjs/common';
import { EventStatus } from '../constants/event-status.enum';
import { EventLogsParams } from '../polling.types';

@Injectable()
export class EventLogRepository extends Repository<EventLog> {
  constructor(private dataSource: DataSource) {
    super(EventLog, dataSource.createEntityManager());
  }

  async isDuplicateInDB(transaction_hash: string, logIndex: number): Promise<boolean> {
    const lastEvent = await this.findOne({
      where: {
        transaction_hash: transaction_hash,
        log_index: logIndex,
        status: EventStatus.CONFIRMED,
      },
      select: ['id'],
    });
    return !!lastEvent;
  }

  async insertOrUpdateEvent(event: EventLogsParams): Promise<void> {
    await this.upsert(event, { conflictPaths: ['transaction_hash', 'log_index'] });
  }

  async updateEventStatus(
    transaction_hash: string,
    log_index: number,
    status: EventStatus,
  ): Promise<void> {
    await this.update({ transaction_hash, log_index }, { status });
  }
}
