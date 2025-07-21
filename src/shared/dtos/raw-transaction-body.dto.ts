import { IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { Hex } from 'viem';

export class RawTransactionBodyDto {
  @IsString()
  @IsNotEmpty()
  rawTransaction: Hex;
}