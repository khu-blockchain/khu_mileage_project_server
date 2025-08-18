import { Injectable } from '@nestjs/common';
import { DataSource, ILike, Repository } from 'typeorm';

import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

import { MileagePointHistory } from '../entities/mileage-point-history.entity';
import {
  CreateMileagePointHistoryParams,
  GetMileagePointHistoriesParams,
} from '../mileage-point-history.types';

@Injectable()
export class MileagePointHistoryRepository extends Repository<MileagePointHistory> {
  constructor(private readonly dataSource: DataSource) {
    super(MileagePointHistory, dataSource.createEntityManager());
  }

  async getMileagePointHistories(
    params: GetMileagePointHistoriesParams,
  ): Promise<[MileagePointHistory[], number]> {
    const { take, skip, studentName, mileageId, all } = params;

    const [mileagePointHistories, total] = await this.findAndCount({
      where: {
        ...((mileageId || studentName) && {
          mileage: {
            ...(mileageId && { id: mileageId }),
            ...(studentName && { student: { name: ILike(`%${studentName}%`) } }),
          },
        }),
      },
      ...(!all && { take }),
      ...(!all && { skip }),
      relations: ['mileage', 'mileage.student'],
      order: {
        created_at: 'DESC',
      },
    });
    return [mileagePointHistories, total];
  }

  async createMileagePointHistoryInit(
    params: CreateMileagePointHistoryParams,
  ): Promise<MileagePointHistory> {
    const newMileagePointHistory = this.create(params);
    return this.save(newMileagePointHistory);
  }

  async updateMileagePointHistoryTransactionHash(
    id: number,
    transaction_hash: string,
  ): Promise<MileagePointHistory | null> {
    const mileagePointHistory = await this.findOneBy({ id });
    if (!mileagePointHistory) {
      return null;
    }
    return this.save({ ...mileagePointHistory, transaction_hash });
  }

  async getMileagePointHistoryByTransactionHash(
    transaction_hash: string,
  ): Promise<MileagePointHistory | null> {
    const mileagePointHistory = await this.findOneBy({ transaction_hash });
    if (!mileagePointHistory) {
      return null;
    }
    return mileagePointHistory;
  }

  //========== Event Callback ============

  async confirmMileagePointHistory(
    id: number,
    transaction_status: TRANSACTION_STATUS,
  ): Promise<MileagePointHistory | null> {
    const mileagePointHistory = await this.findOneBy({ id });
    if (!mileagePointHistory) {
      return null;
    }
    return this.save({ ...mileagePointHistory, transaction_status });
  }
}
