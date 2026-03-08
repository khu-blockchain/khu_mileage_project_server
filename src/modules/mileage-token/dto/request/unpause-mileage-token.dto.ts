import { RawTransactionBodyDto } from '@/shared/dtos';

export class UnpauseMileageTokenRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<UnpauseMileageTokenRequest>) {
    super();
    Object.assign(this, partial);
  }
}
