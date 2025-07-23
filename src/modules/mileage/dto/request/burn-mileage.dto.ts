import { RawTransactionBodyDto } from '@/shared/dtos/raw-transaction-body.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

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
