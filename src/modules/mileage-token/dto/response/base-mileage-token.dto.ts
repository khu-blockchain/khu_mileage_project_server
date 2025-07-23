import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { Expose } from 'class-transformer';

export class BaseMileageTokenDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  contract_address: string;

  @Expose()
  symbol: string;

  @Expose()
  image_url: string;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  transaction_hash: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
