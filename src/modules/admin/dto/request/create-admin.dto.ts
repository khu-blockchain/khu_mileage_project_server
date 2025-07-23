import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { Address } from '@kaiachain/viem-ext';
import { IsAddress, Match } from '@/shared/validators';

export class CreateAdminRequest {
  @IsString()
  @IsNotEmpty()
  adminId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' })
  passwordConfirm: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsAddress()
  @IsNotEmpty()
  walletAddress: Address;
}
