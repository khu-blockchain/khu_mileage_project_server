import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMileageCategoryRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
