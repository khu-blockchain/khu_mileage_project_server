import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { POINT_TYPE } from '../../constants/point-type.enum';

export class CreateMileageActivityRequest {
  @IsNotEmpty()
  @IsNumber()
  mileage_category_id: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(POINT_TYPE)
  point_type: POINT_TYPE;

  @IsNotEmpty()
  @IsString()
  point_description: string;

  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  fixed_point?: number;
}
