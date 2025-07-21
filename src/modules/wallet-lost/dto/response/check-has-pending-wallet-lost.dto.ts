import { Expose } from 'class-transformer';
import { BaseWalletLost } from './base-wallet-lost.dto';

export class CheckHasPendingWalletLostResponse {
  @Expose()
  result: boolean;

  @Expose()
  data: BaseWalletLost | null;
}