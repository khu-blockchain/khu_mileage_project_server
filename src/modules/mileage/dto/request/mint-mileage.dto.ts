import { IsNumber, IsOptional, IsString } from 'class-validator';

import { RawTransactionBodyDto } from '@/shared/dtos';

export class MintMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<MintMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  mileagePoint: number;

  @IsString()
  @IsOptional()
  note?: string;
}
