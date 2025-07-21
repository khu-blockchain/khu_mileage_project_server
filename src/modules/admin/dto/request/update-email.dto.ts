import { IsNotEmpty, IsEmail } from 'class-validator';

export class UpdateEmailRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
