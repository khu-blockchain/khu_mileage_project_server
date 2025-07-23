import { RawTransactionBodyDto } from '@/shared/dtos';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<RejectMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsNotEmpty()
  adminComment: string;
}
