import { IsNotEmpty, IsString } from 'class-validator';

export class StudentLoginRequest {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
