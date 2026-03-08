import { Address } from '@kaiachain/viem-ext';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { CreateAdminParams } from '@/modules/admin/admin.types';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

@Injectable()
export class AdminRepository extends Repository<Admin> {
  constructor(private dataSource: DataSource) {
    super(Admin, dataSource.createEntityManager());
  }

  async createAdmin(data: CreateAdminParams): Promise<Admin> {
    const newAdmin = this.create({
      ...data,
    });
    return this.save(newAdmin);
  }

  async updateAdmin(adminId: string, data: Partial<Admin>): Promise<Admin | null> {
    const admin = await this.findAdminByAdminId(adminId);
    if (!admin) {
      return null;
    }
    return this.save({ ...admin, ...data });
  }

  async updateAdminTxHash(adminId: string, transaction_hash: string): Promise<Admin | null> {
    return this.updateAdmin(adminId, { transaction_hash });
  }

  async findAdminByAdminId(adminId: string): Promise<Admin | null> {
    return this.findOneBy({ admin_id: adminId });
  }

  async findAdminByWalletAddress(walletAddress: Address): Promise<Admin | null> {
    return this.findOneBy({ wallet_address: walletAddress });
  }

  async updateEmail(adminId: string, email: string): Promise<Admin | null> {
    return this.updateAdmin(adminId, { email });
  }

  //========== Event Callback ============
  async handleAdminAddedEvent(adminId: string, status: TRANSACTION_STATUS): Promise<Admin | null> {
    return this.updateAdmin(adminId, { transaction_status: status });
  }
}
