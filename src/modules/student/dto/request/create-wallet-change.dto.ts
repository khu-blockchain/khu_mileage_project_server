import { RawTransactionBodyDto } from '@/shared/dtos/raw-transaction-body.dto';

export class CreateWalletChangeRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<CreateWalletChangeRequest>) {
    super();
    Object.assign(this, partial);
  }
}
