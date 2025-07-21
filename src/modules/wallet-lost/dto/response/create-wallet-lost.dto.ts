import { BaseWalletLost } from './base-wallet-lost.dto';

export class CreateWalletLostResponse extends BaseWalletLost {
  constructor(partial: Partial<CreateWalletLostResponse>) {
    super();
    Object.assign(this, partial);
  }
}
