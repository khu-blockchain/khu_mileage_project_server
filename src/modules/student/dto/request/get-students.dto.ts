import { IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';

export class GetStudentsRequest extends PaginationParamsDto {
  constructor(partial: Partial<GetStudentsRequest>) {
    super();
    Object.assign(this, partial);
  }

  @IsString()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
