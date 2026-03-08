import { IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateEmailRequest {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
