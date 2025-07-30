import { Hex } from '@kaiachain/viem-ext';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MileageToken } from '@/modules/mileage-token/entities/mileage-token.entity';
import { CreateMileageTokenParams } from '@/modules/mileage-token/mileage-token.types';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

@Injectable()
export class MileageTokenRepository extends Repository<MileageToken> {
  constructor(private dataSource: DataSource) {
    super(MileageToken, dataSource.createEntityManager());
  }

  async createMileageTokenInit(data: CreateMileageTokenParams): Promise<MileageToken> {
    const newMileageToken = this.create({
      ...data,
    });
    return this.save(newMileageToken);
  }

  async updateMileageTokenTransactionHash(
    id: number,
    transaction_hash: string,
  ): Promise<MileageToken> {
    const mileageToken = await this.findOneBy({ id });
    if (!mileageToken) {
      throw new NotFoundException();
    }
    return this.save({ ...mileageToken, transaction_hash });
  }

  async findAll(): Promise<MileageToken[]> {
    return await this.findBy({ transaction_status: TRANSACTION_STATUS.CONFIRMED });
  }

  async findById(id: number): Promise<MileageToken | null> {
    return this.findOneBy({ id });
  }

  async findByContractAddress(contractAddress: Hex): Promise<MileageToken | null> {
    return this.findOneBy({ contract_address: contractAddress });
  }
}
