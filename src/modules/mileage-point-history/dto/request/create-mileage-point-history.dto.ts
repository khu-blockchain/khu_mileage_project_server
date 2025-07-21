import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { MILEAGE_POINT_HISTORY_TYPE } from '../../constants/mileage-point-history-type.enum';
import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

// used between service
export class CreateMileagePointHistoryRequest {
  type: MILEAGE_POINT_HISTORY_TYPE;
  mileage_token_name: string;
  mileage_activity_name: string;
  mileage_category_name: string;
  mileage_point: number;
  note?: string;
  transaction_status: TRANSACTION_STATUS;
  transaction_hash: string;
  mileage: Mileage;
}
