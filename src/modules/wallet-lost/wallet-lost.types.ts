export type CreateWalletLostParams = {
  student_id: string;
  student_name: string;
  previous_wallet_address: string;
  request_wallet_address: string;
};

export type GetWalletLostListQuery = {
  take: number;
  skip: number;
  studentId: string;
};
