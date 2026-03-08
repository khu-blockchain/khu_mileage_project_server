import { IsNotEmpty, IsString } from 'class-validator';

import { RawTransactionBodyDto } from '@/shared/dtos';

export class RejectMileageRequest extends RawTransactionBodyDto {
  constructor(partial: Partial<RejectMileageRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsNotEmpty()
  adminComment: string;
}
