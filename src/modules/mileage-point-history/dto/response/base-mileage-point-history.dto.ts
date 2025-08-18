import { Expose } from 'class-transformer';

import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { MILEAGE_POINT_HISTORY_TYPE } from '../../constants/mileage-point-history-type.enum';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

export class BaseMileagePointHistoryDto {
  @Expose()
  id: number;

  @Expose()
  type: MILEAGE_POINT_HISTORY_TYPE;

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
  mileage: Mileage;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
