import { IsNumber } from 'class-validator';

import { RawTransactionBodyDto } from '@/shared/dtos';

export class ApproveMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<ApproveMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  mileagePoint: number;
}
