import { IsString, IsNotEmpty, IsEthereumAddress, IsEmail, IsBoolean } from 'class-validator';
import { Address, Hex } from '@kaiachain/viem-ext';

export class CreateStudentRequest {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  passwordConfirm: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;

  @IsString()
  @IsNotEmpty()
  bankCode: string;

  @IsBoolean()
  @IsNotEmpty()
  personalInformationConsentStatus: boolean;

  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: Address;

  @IsString()
  @IsNotEmpty()
  studentHash: string;

  @IsString()
  @IsNotEmpty()
  rawTransaction: Hex;
}
