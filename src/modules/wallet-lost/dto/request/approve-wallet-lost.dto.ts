import { RawTransactionBodyDto } from '@/shared/dtos/raw-transaction-body.dto';
import { IsNumber } from 'class-validator';

export class ApproveWalletLostRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<ApproveWalletLostRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  id: number;
}