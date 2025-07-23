import { TRANSACTION_STATUS } from '@/shared/constants/enums';
import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { Expose } from 'class-transformer';

export class BaseMileagePointHistoryDto {
  @Expose()
  id: number;

  @Expose()
  mileage_token_name: string;

  @Expose()
  mileage_activity_name: string;

  @Expose()
  mileage_category_name: string;

  @Expose()
  mileage_point: number;

  @Expose()
  transaction_hash: string;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  note: string;

  @Expose()
  student_id?: string;

  @Expose()
  mileage?: Mileage;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
