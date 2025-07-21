import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WalletLost } from '../entities/wallet-lost.entity';
import { CreateWalletLostParams, GetWalletLostListQuery } from '../wallet-lost.types';
import { WALLET_LOST_STATUS } from '../constants/wallet-lost-status.enum';

@Injectable()
export class WalletLostRepository extends Repository<WalletLost> {
  constructor(private readonly dataSource: DataSource) {
    super(WalletLost, dataSource.createEntityManager());
  }

  async createWalletLost(params: CreateWalletLostParams): Promise<WalletLost> {
    const walletLost = this.create(params);
    return this.save(walletLost);
  }

  async findPendingWalletLostByStudentId(studentId: string): Promise<WalletLost | null> {
    return this.findOne({
      where: { student_id: studentId, status: WALLET_LOST_STATUS.CREATED },
    });
  }

  async getWalletLostById(id: number): Promise<WalletLost | null> {
    return this.findOne({
      where: { id },
    });
  }

  async getWalletLostByTransactionHash(transactionHash: string): Promise<WalletLost | null> {
    return this.findOne({
      where: { transaction_hash: transactionHash },
    });
  }

  async getWalletLostList(params: GetWalletLostListQuery): Promise<[WalletLost[], number]> {
    const { take, skip, studentId } = params;
    return this.findAndCount({
      where: { student_id: studentId },
      take,
      skip,
      order: {
        created_at: 'DESC',
      },
    });
  }

  async updateWallet(id: number, params: Partial<WalletLost>): Promise<WalletLost | null> {
    const walletLost = await this.getWalletLostById(id);
    if (!walletLost) {
      return null;
    }

    return this.save({
      ...walletLost,
      ...params,
    });
  }
}
