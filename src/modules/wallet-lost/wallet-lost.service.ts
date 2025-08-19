import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

import { KaiaService } from '../kaia/kaia.service';
import { StudentService } from '../student/student.service';
import { WALLET_LOST_STATUS } from './constants/wallet-lost-status.enum';
import { ApproveWalletLostRequest, CreateWalletLostRequest, GetWalletLostListRequest } from './dto';
import { WalletLost } from './entities/wallet-lost.entity';
import { WalletLostRepository } from './repository/wallet-lost.repository';
import { CreateWalletLostParams, GetWalletLostListQuery } from './wallet-lost.types';

@Injectable()
export class WalletLostService {
  constructor(
    private readonly walletLostRepository: WalletLostRepository,
    private readonly studentService: StudentService,
    private readonly kaiaService: KaiaService,
  ) {}

  async createWalletLost(studentId: string, request: CreateWalletLostRequest): Promise<WalletLost> {
    const { targetAddress } = request;
    const student = await this.studentService.getStudentByStudentId(studentId);

    const { hasPendingWalletLost } = await this.checkHasPendingWalletLost(studentId);

    if (hasPendingWalletLost) {
      throw new BadRequestException('이미 신청된 지갑 분실 내역이 있습니다.');
    }

    const createWalletLostParams: CreateWalletLostParams = {
      student_id: studentId,
      student_name: student.name,
      student_hash: student.student_hash,
      previous_wallet_address: student.wallet_address,
      request_wallet_address: targetAddress,
    };

    const walletLost = await this.walletLostRepository.createWalletLost(createWalletLostParams);
    return walletLost;
  }

  async checkHasPendingWalletLost(studentId: string): Promise<{
    hasPendingWalletLost: boolean;
    data: WalletLost | null;
  }> {
    await this.studentService.getStudentByStudentId(studentId);
    const walletLost = await this.walletLostRepository.findPendingWalletLostByStudentId(studentId);
    return {
      hasPendingWalletLost: !!walletLost,
      data: walletLost,
    };
  }

  async getWalletLostList(query: GetWalletLostListRequest): Promise<{
    walletLosts: WalletLost[];
    total: number;
  }> {
    const { limit, page, studentId } = query;
    const take = limit;
    const skip = (page - 1) * limit;

    const getWalletLostListParams: GetWalletLostListQuery = {
      take,
      skip,
      studentId,
    };

    const [walletLosts, total] =
      await this.walletLostRepository.getWalletLostList(getWalletLostListParams);
    return {
      walletLosts,
      total,
    };
  }

  async approveWalletLost(request: ApproveWalletLostRequest): Promise<WalletLost> {
    const { id, rawTransaction } = request;
    const walletLost = await this.walletLostRepository.getWalletLostById(id);
    if (!walletLost) {
      throw new NotFoundException('Wallet lost not found');
    }

    if (walletLost.status !== WALLET_LOST_STATUS.CREATED) {
      throw new BadRequestException('Wallet lost is not pending');
    }

    // const txHash = await this.kaiaService.sendTransactionWithFeePayerSign(rawTransaction);
    const { txHash, feePayerSignedTx } =
      await this.kaiaService.calcTxHashFromRawTransaction(rawTransaction);

    const updatedWalletLost = await this.walletLostRepository.updateWallet(id, {
      transaction_hash: txHash,
      transaction_status: TRANSACTION_STATUS.PROCESSING,
      status: WALLET_LOST_STATUS.APPROVED,
    });
    if (!updatedWalletLost) {
      throw new InternalServerErrorException('Failed to update wallet lost');
    }

    await this.kaiaService.sendFeepayerSignedTransaction(feePayerSignedTx);

    return updatedWalletLost;
  }

  //========== Event handler ==========/

  async handleAccountChangedEvent(transactionHash: string): Promise<WalletLost> {
    const walletLost =
      await this.walletLostRepository.getWalletLostByTransactionHash(transactionHash);
    if (!walletLost) {
      throw new NotFoundException('Wallet lost not found');
    }

    const updatedWalletLost = await this.walletLostRepository.updateWallet(walletLost.id, {
      transaction_status: TRANSACTION_STATUS.CONFIRMED,
    });
    if (!updatedWalletLost) {
      throw new InternalServerErrorException('Failed to update wallet lost');
    }

    return updatedWalletLost;
  }
}
