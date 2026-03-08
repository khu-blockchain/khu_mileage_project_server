import { IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginRequest {
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
