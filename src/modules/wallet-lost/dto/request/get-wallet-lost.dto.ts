import { IsOptional, IsString } from 'class-validator';

import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';

export class GetWalletLostListRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetWalletLostListRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  studentId: string;
}
