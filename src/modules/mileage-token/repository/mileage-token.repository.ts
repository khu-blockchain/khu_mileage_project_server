import { Hex } from '@kaiachain/viem-ext';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MileageToken } from '@/modules/mileage-token/entities/mileage-token.entity';
import { CreateMileageTokenParams } from '@/modules/mileage-token/mileage-token.types';

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

  async createMileageTokenInitNotNull(data: CreateMileageTokenParams): Promise<MileageToken> {
    const newMileageToken = this.create({
      ...data,
      contract_address: '0x',
      transaction_hash: '0x',
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
    //TODO: MileageTokenAdd Event 추가 후 수정
    // return await this.findBy({ transaction_status: TRANSACTION_STATUS.CONFIRMED });
    return await this.find();
  }

  async findById(id: number): Promise<MileageToken | null> {
    return this.findOneBy({ id });
  }

  async findByContractAddress(contractAddress: Hex): Promise<MileageToken | null> {
    return this.findOneBy({ contract_address: contractAddress });
  }

  async getMileageTokenByTransactionHash(transaction_hash: Hex): Promise<MileageToken | null> {
    const mileageToken = await this.findOneBy({ transaction_hash });
    if (!mileageToken) {
      return null;
    }
    return mileageToken;
  }

  async updateMileageToken(
    id: number,
    params: Partial<MileageToken>,
  ): Promise<MileageToken | null> {
    const mileageToken = await this.findOneBy({ id });
    if (!mileageToken) {
      return null;
    }
    return this.save({
      ...mileageToken,
      ...params,
    });
  }
}
