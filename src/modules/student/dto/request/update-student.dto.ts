import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateStudentRequest {
  @IsString()
  @IsNotEmpty()
  changeStudentId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;
}
