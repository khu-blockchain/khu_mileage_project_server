import { RawTransactionBodyDto } from '@/shared/dtos';
import { IsNumber } from 'class-validator';

export class ApproveMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<ApproveMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  mileagePoint: number;
}
