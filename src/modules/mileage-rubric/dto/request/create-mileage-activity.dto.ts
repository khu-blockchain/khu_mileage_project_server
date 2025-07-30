import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

import { POINT_TYPE } from '@/modules/mileage-rubric/constants/point-type.enum';

export class CreateMileageActivityRequest {
  @IsNotEmpty()
  @IsNumber()
  mileageCategoryId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(POINT_TYPE)
  pointType: POINT_TYPE;

  @IsNotEmpty()
  @IsString()
  pointDescription: string;

  @IsNumber()
  @IsOptional()
  fixedPoint?: number;
}
