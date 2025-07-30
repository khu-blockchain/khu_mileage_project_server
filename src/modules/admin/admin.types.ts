import { Address } from '@kaiachain/viem-ext';

import { TRANSACTION_STATUS } from '@/shared/constants/enums';

export type CreateAdminParams = {
  admin_id: string;
  name: string;
  email: string;
  wallet_address: Address;
  password: string;
  transaction_status: TRANSACTION_STATUS;
};
