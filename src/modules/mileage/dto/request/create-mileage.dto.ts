import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Hex } from 'viem';

export class CreateMileageRequest {
  @IsString()
  @IsNotEmpty() 
  studentId: string;

  @IsString()
  @IsNotEmpty()
  mileageActivityId: string; // need to change to number

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