import { Expose } from 'class-transformer';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Address } from '@kaiachain/viem-ext';

export class BaseAdminDto {
  @Expose()
  admin_id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  wallet_address: Address;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
