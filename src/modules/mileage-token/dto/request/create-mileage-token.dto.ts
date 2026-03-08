import { Hex } from '@kaiachain/viem-ext';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMileageTokenRequest {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  symbol: string;

  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsNotEmpty()
  @IsString()
  rawTransaction: Hex;
}
