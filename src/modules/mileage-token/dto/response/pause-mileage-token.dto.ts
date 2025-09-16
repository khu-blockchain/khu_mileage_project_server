import { SuccessResponse } from '@/shared/dtos';

export class PauseMileageTokenResponse extends SuccessResponse {
  constructor(partial: Partial<PauseMileageTokenResponse>) {
    super();
    Object.assign(this, partial);
  }
}
