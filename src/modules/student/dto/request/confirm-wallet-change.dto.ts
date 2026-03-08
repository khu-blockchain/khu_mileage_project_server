import { RawTransactionBodyDto } from '@/shared/dtos/raw-transaction-body.dto';

export class ConfirmWalletChangeRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<ConfirmWalletChangeRequest>) {
    super();
    Object.assign(this, partial);
  }
}
