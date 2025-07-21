import { Hex } from '@kaiachain/viem-ext';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateMileageTokenRequest {
  @IsNotEmpty()
  @IsString()
  raw_transaction: Hex;
}
