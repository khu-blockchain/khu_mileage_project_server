import { WALLET_LOST_STATUS } from './constants/wallet-lost-status.enum';

export type CreateWalletLostParams = {
  student_id: string;
  student_name: string;
  student_hash: string;
  previous_wallet_address: string;
  request_wallet_address: string;
};

export type GetWalletLostListQuery = {
  take: number;
  skip: number;
  student_id?: string;
  status?: WALLET_LOST_STATUS;
  all?: boolean;
};
