import { Expose } from 'class-transformer';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';

import { WALLET_LOST_STATUS } from '../../constants/wallet-lost-status.enum';

export class BaseWalletLost {
  @Expose()
  id: number;

  @Expose()
  student_id: string;

  @Expose()
  student_name: string;

  @Expose()
  student_hash: string;

  @Expose()
  status: WALLET_LOST_STATUS;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  previous_wallet_address: string;

  @Expose()
  request_wallet_address: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
