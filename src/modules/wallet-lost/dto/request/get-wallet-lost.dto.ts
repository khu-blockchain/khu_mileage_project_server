import { IsOptional, IsString } from 'class-validator';

import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { WALLET_LOST_STATUS } from '../../constants/wallet-lost-status.enum';

export class GetWalletLostListRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetWalletLostListRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  all: string;

  @IsString()
  @IsOptional()
  status: WALLET_LOST_STATUS;

  @IsString()
  @IsOptional()
  studentId: string;
}
