import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';

import { CreateMileagePointHistoryRequest, GetMileagePointHistoriesRequest } from './dto';
import { MileagePointHistory } from './entities/mileage-point-history.entity';
import {
  CreateMileagePointHistoryParams,
  GetMileagePointHistoriesParams,
} from './mileage-point-history.types';
import { MileagePointHistoryRepository } from './repository/mileage-point-history.repository';

@Injectable()
export class MileagePointHistoryService {
  constructor(private readonly mileagePointHistoryRepository: MileagePointHistoryRepository) {}

  async getMileagePointHistories(query: GetMileagePointHistoriesRequest): Promise<{
    mileagePointHistories: MileagePointHistory[];
    total: number;
  }> {
    const { limit, page, studentId, mileageId, mileageTokenName } = query;
    const take = limit;
    const skip = (page - 1) * limit;

    const getMileagePointHistoriesParams: GetMileagePointHistoriesParams = {
      take,
      skip,
      studentId,
      mileageId,
      mileageTokenName,
    };
    const [mileagePointHistories, total] =
      await this.mileagePointHistoryRepository.getMileagePointHistories(
        getMileagePointHistoriesParams,
      );

    return { mileagePointHistories, total };
  }

  async createMileagePointHistoryInit(
    mileagePointHistory: CreateMileagePointHistoryRequest,
  ): Promise<MileagePointHistory> {
    const params: CreateMileagePointHistoryParams = {
      type: mileagePointHistory.type,
      mileage_token_name: mileagePointHistory.mileageTokenName,
      mileage_activity_name: mileagePointHistory.mileageActivityName,
      mileage_category_name: mileagePointHistory.mileageCategoryName,
      mileage_point: mileagePointHistory.mileagePoint,
      transaction_status: mileagePointHistory.transactionStatus,
      note: mileagePointHistory.note ?? '-',
      transaction_hash: mileagePointHistory.transactionHash,
      mileage: mileagePointHistory.mileage,
    };

    return this.mileagePointHistoryRepository.createMileagePointHistoryInit(params);
  }

  async updateMileagePointHistoryTransactionHash(
    id: number,
    transaction_hash: string,
  ): Promise<MileagePointHistory> {
    const mileagePointHistory =
      await this.mileagePointHistoryRepository.updateMileagePointHistoryTransactionHash(
        id,
        transaction_hash,
      );

    if (!mileagePointHistory) {
      throw new NotFoundException('Mileage point history not found');
    }
    return mileagePointHistory;
  }

  async getMileagePointHistoryByTransactionHash(
    transaction_hash: string,
  ): Promise<MileagePointHistory> {
    const mileagePointHistory =
      await this.mileagePointHistoryRepository.getMileagePointHistoryByTransactionHash(
        transaction_hash,
      );
    if (!mileagePointHistory) {
      throw new NotFoundException('Mileage point history not found');
    }
    return mileagePointHistory;
  }

  //==============Event callback===================

  async handleDocApprovedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    if (!transaction_hash) {
      throw new BadRequestException('잘못된 트랜잭션 해시입니다.');
    }

    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    if (!mileagePointHistory) {
      throw new NotFoundException('Mileage point history not found');
    }
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleDocRejectedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    if (!transaction_hash) {
      throw new BadRequestException('잘못된 트랜잭션 해시입니다.');
    }

    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleMileageMintedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    if (!transaction_hash) {
      throw new BadRequestException('잘못된 트랜잭션 해시입니다.');
    }

    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleMileageBurnedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    if (!transaction_hash) {
      throw new BadRequestException('잘못된 트랜잭션 해시입니다.');
    }

    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }
}
