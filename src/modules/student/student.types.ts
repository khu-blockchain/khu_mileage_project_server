import { Address } from '@kaiachain/viem-ext';

export type CreateStudentParams = {
  student_id: string;
  name: string;
  password: string;
  email: string;
  wallet_address: Address;
  department: string;
  bank_account_number: string;
  bank_code: string;
  personal_information_consent: boolean;
  personal_information_consent_date: Date;
  student_hash: string;
};

export type GetStudentsParams = {
  take: number;
  skip: number;
  student_id?: string;
  name?: string;
};
