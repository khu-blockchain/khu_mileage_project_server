import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { PaginationParamsDto } from '@/shared/dtos';
import { MILEAGE_POINT_HISTORY_TYPE } from '../../constants/mileage-point-history-type.enum';

export class GetMileagePointHistoriesRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetMileagePointHistoriesRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  all: string;

  @IsString()
  @IsOptional()
  mileageId: string;

  @IsString()
  @IsOptional()
  type: MILEAGE_POINT_HISTORY_TYPE;

  @IsString()
  @IsOptional()
  mileageTokenName: string;

  @IsString()
  @IsOptional()
  studentId: string;
}
