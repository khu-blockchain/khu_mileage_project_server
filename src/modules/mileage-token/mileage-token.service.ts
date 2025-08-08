import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateMileageTokenRequest,
  ActivateMileageTokenRequest,
} from '@/modules/mileage-token/dto';
import { MileageTokenRepository } from '@/modules/mileage-token/repository/mileage-token.repository';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { Transactional } from 'typeorm-transactional';
import { KaiaService } from '@/modules/kaia/kaia.service';
import { MileageToken } from '@/modules/mileage-token/entities/mileage-token.entity';
import { CreateMileageTokenParams } from '@/modules/mileage-token/mileage-token.types';
import { Hex } from '@kaiachain/viem-ext';

@Injectable()
export class MileageTokenService {
  constructor(
    private readonly mileageTokenRepository: MileageTokenRepository,
    private readonly kaiaService: KaiaService,
  ) {}

  @Transactional()
  async create(input: CreateMileageTokenRequest): Promise<MileageToken> {
    const { raw_transaction, ...rest } = input;

    const createMileageTokenParams: CreateMileageTokenParams = {
      ...rest,
      transaction_status: TRANSACTION_STATUS.PROCESSING,
    };

    // const pendingMileageToken =
    //   await this.mileageTokenRepository.createMileageTokenInit(createMileageTokenParams);
    const pendingMileageToken =
      await this.mileageTokenRepository.createMileageTokenInitNotNull(createMileageTokenParams);

    const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(raw_transaction);

    return await this.mileageTokenRepository.updateMileageTokenTransactionHash(
      pendingMileageToken.id,
      txHash,
    );
  }

  async findAll(): Promise<MileageToken[]> {
    return await this.mileageTokenRepository.findAll();
  }

  async activate(id: number, input: ActivateMileageTokenRequest): Promise<{ success: boolean }> {
    const mileageToken = await this.mileageTokenRepository.findById(id);
    if (!mileageToken) {
      throw new NotFoundException('Mileage token not found');
    }

    const { raw_transaction } = input;

    await this.kaiaService.sendTransactionWithFeePayerSign(raw_transaction);

    return {
      success: true,
    };
  }

  async getMileageTokenByContractAddress(contractAddress: Hex): Promise<MileageToken> {
    const mileageToken = await this.mileageTokenRepository.findByContractAddress(contractAddress);
    if (!mileageToken) {
      throw new NotFoundException('Mileage token not found');
    }

    return mileageToken;
  }
}
