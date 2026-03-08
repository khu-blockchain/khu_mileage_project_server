import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMileageRequest {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  mileageActivityId: string;

  @IsString()
  @IsNotEmpty()
  mileageCategoryName: string;

  @IsString()
  @IsNotEmpty()
  mileageDescription: string;

  @IsString()
  @IsNotEmpty()
  docHash: string;

  @IsString()
  @IsNotEmpty()
  rawTransaction: string;
}
