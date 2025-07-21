import { Expose } from 'class-transformer';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

export class BaseAdminDto {
  @Expose()
  id: number;

  @Expose()
  admin_id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  wallet_address: string;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
