import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

export type CreateAdminParams = {
  admin_id: string;
  name: string;
  email: string;
  wallet_address: string;
  password: string;
  transaction_status: TRANSACTION_STATUS;
};
