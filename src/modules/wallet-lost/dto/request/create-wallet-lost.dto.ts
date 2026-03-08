import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWalletLostRequest {
  @IsString()
  @IsNotEmpty()
  targetAddress: string;
}
