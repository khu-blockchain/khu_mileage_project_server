import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { IsNumber, IsOptional, IsNotEmpty, IsString } from 'class-validator';
import { MILEAGE_STATUS } from '../../constants/mileage-status.enum';

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
