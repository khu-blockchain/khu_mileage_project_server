import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetWalletLostListRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetWalletLostListRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  studentId: string;
}
