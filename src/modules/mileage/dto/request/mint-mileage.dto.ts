import { RawTransactionBodyDto } from '@/shared/dtos/raw-transaction-body.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

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
