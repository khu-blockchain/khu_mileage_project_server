import { RawTransactionBodyDto } from '@/shared/dtos';

export class PauseMileageTokenRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<PauseMileageTokenRequest>) {
    super();
    Object.assign(this, partial);
  }
}
