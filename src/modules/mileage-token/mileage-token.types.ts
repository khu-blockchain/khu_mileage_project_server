import { TRANSACTION_STATUS } from '@/shared/constants/enums';

export type CreateMileageTokenParams = {
  name: string;
  description: string;
  symbol: string;
  image_url: string;
  transaction_status: TRANSACTION_STATUS;
};
