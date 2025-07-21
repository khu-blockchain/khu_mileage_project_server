import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMileageCategoryRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}