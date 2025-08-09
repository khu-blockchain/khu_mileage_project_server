import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import {
  ActivateMileageTokenRequest,
  CreateMileageTokenRequest,
} from '@/modules/mileage-token/dto';
import { MileageToken } from '@/modules/mileage-token/entities/mileage-token.entity';
import { CreateMileageTokenParams } from '@/modules/mileage-token/mileage-token.types';
import { MileageTokenRepository } from '@/modules/mileage-token/repository/mileage-token.repository';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { Transactional } from 'typeorm-transactional';
import { KaiaService } from '../kaia/kaia.service';
import { Hex } from '@kaiachain/viem-ext';

@Injectable()
export class MileageTokenService {
  constructor(
    private readonly mileageTokenRepository: MileageTokenRepository,
    private readonly kaiaService: KaiaService,
  ) {}

  @Transactional()
  async create(input: CreateMileageTokenRequest): Promise<MileageToken> {
    try {
      const { rawTransaction, ...rest } = input;

      console.log('rawTransaction', rawTransaction);
      console.log('rest', rest);

      const createMileageTokenParams: CreateMileageTokenParams = {
        ...rest,
        image_url: rest.imageUrl,
        transaction_status: TRANSACTION_STATUS.PROCESSING,
      };

      // const pendingMileageToken =
      //   await this.mileageTokenRepository.createMileageTokenInit(createMileageTokenParams);
      const pendingMileageToken =
        await this.mileageTokenRepository.createMileageTokenInitNotNull(createMileageTokenParams);

      const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

      return await this.mileageTokenRepository.updateMileageTokenTransactionHash(
        pendingMileageToken.id,
        txHash,
      );
    } catch (error) {
      console.error('Failed to create mileage token:', error);
      throw new InternalServerErrorException('Failed to create mileage token');
    }
  }

  async findAll(): Promise<MileageToken[]> {
    return await this.mileageTokenRepository.find({
      where: {
        transaction_status: TRANSACTION_STATUS.CONFIRMED,
      },
    });
  }

  async activate(id: number, input: ActivateMileageTokenRequest): Promise<{ success: boolean }> {
    const mileageToken = await this.mileageTokenRepository.findById(id);
    if (!mileageToken) {
      throw new NotFoundException('Mileage token not found');
    }

    const { rawTransaction } = input;

    await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);

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

  async handleMileageTokenCreatedEvent(
    tokenAddress: Hex,
    transactionHash: Hex,
  ): Promise<{ success: boolean }> {
    const mileageToken =
      await this.mileageTokenRepository.getMileageTokenByTransactionHash(transactionHash);
    if (!mileageToken) {
      throw new NotFoundException('Mileage token not found');
    }
    const updatedMileageToken = await this.mileageTokenRepository.updateMileageToken(
      mileageToken.id,
      {
        contract_address: tokenAddress,
        transaction_status: TRANSACTION_STATUS.CONFIRMED,
      },
    );

    if (!updatedMileageToken) {
      throw new InternalServerErrorException('Failed to update mileage token');
    }

    return { success: true };
  }
}
