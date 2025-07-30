import { Expose } from 'class-transformer';

import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';

export class BaseStudentDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  department: string;

  @Expose()
  wallet_address: string;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  bank_code: string;

  @Expose()
  bank_account_number: string;

  @Expose()
  personal_information_consent: boolean;

  @Expose()
  personal_information_consent_date: Date;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;
}
