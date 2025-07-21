import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { CreateAdminRequest, UpdateEmailRequest } from '@/modules/admin/dto';
import { AdminRepository } from '@/modules/admin/repository/admin.repository';
import { CreateAdminParams } from '@/modules/admin/admin.types';
import { KaiaService } from '@/modules/kaia/kaia.service';
import { hashPassword } from '@/modules/auth/utils/hash.utils';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Address } from '@kaiachain/viem-ext';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly kaiaService: KaiaService,
  ) {}

  @Transactional()
  async createAdmin(input: CreateAdminRequest): Promise<Admin> {
    const { adminId, walletAddress, password } = input;

    if (await this.adminRepository.findAdminByAdminId(adminId)) {
      throw new ConflictException('이미 사용중인 아이디입니다.');
    }

    if (await this.adminRepository.findAdminByWalletAddress(walletAddress)) {
      throw new ConflictException('이미 사용중인 지갑 주소입니다.');
    }

    const hashedPassword = await hashPassword(password);

    const createAdminParams: CreateAdminParams = {
      admin_id: adminId,
      name: input.name,
      email: input.email,
      wallet_address: walletAddress,
      password: hashedPassword,
      transaction_status: TRANSACTION_STATUS.PROCESSING,
    };

    const pendingAdmin = await this.adminRepository.createPendingAdmin(createAdminParams);

    const txHash = await this.kaiaService.addAdmin(pendingAdmin.wallet_address);

    return await this.adminRepository.updatePendingAdmin(pendingAdmin.admin_id, txHash);
  }

  async updateEmail(adminId: string, request: UpdateEmailRequest): Promise<Admin> {
    const { email } = request;

    const admin = await this.adminRepository.findAdminByAdminId(adminId);
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }

    return await this.adminRepository.updateEmail(adminId, email);
  }

  async findAdminByAdminId(adminId: string): Promise<Admin | null> {
    return await this.adminRepository.findAdminByAdminId(adminId);
  }

  async findAdminByWalletAddress(walletAddress: Address): Promise<Admin> {
    const admin = await this.adminRepository.findAdminByWalletAddress(walletAddress);
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }
    return admin;
  }

  //========== Event Callback ============

  async handleAdminAddedEvent(walletAddress: Address): Promise<{ success: boolean }> {
    const admin = await this.findAdminByWalletAddress(walletAddress);

    if (admin.transaction_status === TRANSACTION_STATUS.CONFIRMED) {
      throw new ConflictException('등록이 완료된 관리자입니다.');
    }

    await this.adminRepository.handleAdminAddedEvent(walletAddress, TRANSACTION_STATUS.CONFIRMED);
    return { success: true };
  }
}
