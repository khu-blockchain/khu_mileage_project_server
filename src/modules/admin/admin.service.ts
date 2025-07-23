import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Address } from '@kaiachain/viem-ext';
import { Transactional } from 'typeorm-transactional';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { hashPassword } from '@/modules/auth/utils/hash.utils';
import { KaiaService } from '@/modules/kaia/kaia.service';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { CreateAdminRequest, UpdateEmailRequest } from '@/modules/admin/dto';
import { AdminRepository } from '@/modules/admin/repository/admin.repository';
import { CreateAdminParams } from '@/modules/admin/admin.types';

@Injectable()
export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly kaiaService: KaiaService,
  ) {}

  //========== Public Methods ============

  @Transactional()
  async createAdmin(input: CreateAdminRequest): Promise<Admin> {
    const { adminId, walletAddress, password } = input;

    if (await this.findAdminByAdminId(adminId)) {
      throw new ConflictException('이미 사용중인 아이디입니다.');
    }

    if (await this.findAdminByWalletAddress(walletAddress)) {
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

    const admin = await this.adminRepository.createAdmin(createAdminParams);

    const txHash = await this.kaiaService.addAdmin(admin.wallet_address);

    const updatedAdmin = await this.adminRepository.updateAdminTxHash(admin.admin_id, txHash);
    if (!updatedAdmin) {
      throw new InternalServerErrorException('Failed to update admin');
    }
    return updatedAdmin;
  }

  async updateEmail(adminId: string, request: UpdateEmailRequest): Promise<Admin> {
    const { email } = request;
    const updatedAdmin = await this.adminRepository.updateEmail(adminId, email);
    if (!updatedAdmin) {
      throw new InternalServerErrorException('Failed to update admin');
    }
    return updatedAdmin;
  }

  async findAdminByAdminId(adminId: string): Promise<Admin> {
    const admin = await this.adminRepository.findAdminByAdminId(adminId);
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }
    return admin;
  }

  //========== Event Callback ============

  async handleAdminAddedEvent(walletAddress: Address): Promise<{ success: boolean }> {
    const admin = await this.findAdminByWalletAddress(walletAddress);

    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }

    if (admin.transaction_status === TRANSACTION_STATUS.CONFIRMED) {
      throw new ConflictException('등록이 완료된 관리자입니다.');
    }

    const updatedAdmin = await this.adminRepository.handleAdminAddedEvent(
      admin.admin_id,
      TRANSACTION_STATUS.CONFIRMED,
    );
    if (!updatedAdmin) {
      throw new InternalServerErrorException('Failed to update admin');
    }
    return { success: true };
  }

  //========== Private Methods ============

  private async findAdminByWalletAddress(walletAddress: Address): Promise<Admin> {
    const admin = await this.adminRepository.findAdminByWalletAddress(walletAddress);
    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다.');
    }
    return admin;
  }
}
