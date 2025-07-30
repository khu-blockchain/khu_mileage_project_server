import { IsNumber, IsOptional, IsString } from 'class-validator';

import { RawTransactionBodyDto } from '@/shared/dtos';

export class BurnMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<BurnMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  mileagePoint: number;

  @IsString()
  @IsOptional()
  note?: string;
}
