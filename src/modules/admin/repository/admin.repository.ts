import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { CreateAdminParams } from '../admin.types';
import { Address } from '@kaiachain/viem-ext';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

@Injectable()
export class AdminRepository extends Repository<Admin> {
  constructor(private dataSource: DataSource) {
    super(Admin, dataSource.createEntityManager());
  }

  async createPendingAdmin(data: CreateAdminParams): Promise<Admin> {
    const newAdmin = this.create({
      ...data,
    });
    return this.save(newAdmin);
  }

  async updatePendingAdmin(adminId: string, transaction_hash: string): Promise<Admin> {
    const admin = await this.findOneBy({ admin_id: adminId });
    if (!admin) {
      throw new NotFoundException();
    }
    return this.save({ ...admin, transaction_hash });
  }

  async findAdminByAdminId(adminId: string): Promise<Admin | null> {
    return this.findOneBy({ admin_id: adminId });
  }

  async findAdminByWalletAddress(walletAddress: Address): Promise<Admin | null> {
    return this.findOneBy({ wallet_address: walletAddress });
  }

  async updateEmail(adminId: string, email: string): Promise<Admin> {
    const admin = await this.findOneBy({ admin_id: adminId });
    if (!admin) {
      throw new NotFoundException();
    }
    return this.save({ ...admin, email });
  }

  //========== Event Callback ============
  async handleAdminAddedEvent(
    walletAddress: Address,
    status: TRANSACTION_STATUS,
  ): Promise<Admin | null> {
    const admin = await this.findAdminByWalletAddress(walletAddress);
    if (!admin) {
      return null;
    }
    return this.save({ ...admin, transaction_status: status });
  }
}
