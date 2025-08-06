import { Hex } from '@kaiachain/viem-ext';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateMileageTokenRequest {
  @IsNotEmpty()
  @IsString()
  rawTransaction: Hex;
}
