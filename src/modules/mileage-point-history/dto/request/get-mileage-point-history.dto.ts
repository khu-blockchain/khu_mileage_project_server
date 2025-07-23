import { PaginationParamsDto } from '@/shared/dtos';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetMileagePointHistoriesRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetMileagePointHistoriesRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsNumber()
  @IsOptional()
  mileageId: number;

  @IsString()
  @IsOptional()
  mileageTokenName: string;

  @IsString()
  @IsOptional()
  studentId: string;
}
