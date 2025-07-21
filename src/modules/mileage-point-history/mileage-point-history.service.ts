import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateMileagePointHistoryParams,
  GetMileagePointHistoriesParams,
} from './mileage-point-history.types';
import { MileagePointHistory } from './entities/mileage-point-history.entity';
import { CreateMileagePointHistoryRequest, GetMileagePointHistoriesRequest } from './dto';
import { MileagePointHistoryRepository } from './repository/mileage-point-history.repository';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { MileageService } from '../mileage/mileage.service';

@Injectable()
export class MileagePointHistoryService {
  constructor(
    private readonly mileagePointHistoryRepository: MileagePointHistoryRepository,
    private readonly mileageService: MileageService,
  ) {}

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
    const mileage = await this.mileageService.getMileageById(mileagePointHistory.mileage.id);
    if (!mileage) {
      throw new NotFoundException('Mileage not found');
    }

    const params: CreateMileagePointHistoryParams = {
      type: mileagePointHistory.type,
      mileage_token_name: mileagePointHistory.mileage_token_name,
      mileage_activity_name: mileagePointHistory.mileage_activity_name,
      mileage_category_name: mileagePointHistory.mileage_category_name,
      mileage_point: mileagePointHistory.mileage_point,
      transaction_status: mileagePointHistory.transaction_status,
      note: mileagePointHistory.note ?? '-',
      transaction_hash: mileagePointHistory.transaction_hash,
      mileage,
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
    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleDocRejectedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleMileageMintedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }

  async handleMileageBurnedEvent(transaction_hash: string): Promise<{ success: boolean }> {
    const mileagePointHistory =
      await this.getMileagePointHistoryByTransactionHash(transaction_hash);
    await this.mileagePointHistoryRepository.confirmMileagePointHistory(
      mileagePointHistory.id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    return { success: true };
  }
}
