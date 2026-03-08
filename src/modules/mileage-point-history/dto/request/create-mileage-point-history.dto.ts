import { Mileage } from '@/modules/mileage/entities/mileage.entity';
import { MILEAGE_POINT_HISTORY_TYPE } from '@/modules/mileage-point-history/constants/mileage-point-history-type.enum';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

// used between service
export class CreateMileagePointHistoryRequest {
  type: MILEAGE_POINT_HISTORY_TYPE;
  mileageTokenName: string;
  mileageActivityName: string;
  mileageCategoryName: string;
  mileagePoint: number;
  note?: string;
  transactionStatus: TRANSACTION_STATUS;
  transactionHash: string;
  mileage: Mileage;
}
