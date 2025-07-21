import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Mileage } from '../mileage/entities/mileage.entity';
import { MILEAGE_POINT_HISTORY_TYPE } from './constants/mileage-point-history-type.enum';

export type GetMileagePointHistoriesParams = {
  take: number;
  skip: number;
  studentId?: string;
  mileageId?: number;
  mileageTokenName?: string;
};

export type CreateMileagePointHistoryParams = {
  type: MILEAGE_POINT_HISTORY_TYPE;
  mileage_token_name: string;
  mileage_activity_name: string;
  mileage_category_name: string;
  mileage_point: number;
  transaction_status: TRANSACTION_STATUS;
  note?: string;
  transaction_hash: string;
  mileage: Mileage;
};
