import { Expose } from 'class-transformer';

export class BaseWalletLost {
  @Expose()
  id: number;

  @Expose()
  student_id: string;

  @Expose()
  student_name: string;

  @Expose()
  previous_wallet_address: string;

  @Expose()
  request_wallet_address: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
