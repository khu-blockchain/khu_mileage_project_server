import { PaginationParamsDto } from '@/shared/dtos';
import { IsOptional, IsNotEmpty, IsString } from 'class-validator';
import { MILEAGE_STATUS } from '@/modules/mileage/constants/mileage-status.enum';

export class GetMileagesRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetMileagesRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  studentId?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  status?: MILEAGE_STATUS;
}
