import { SuccessResponse } from '@/shared/dtos';

export class UnpauseMileageTokenResponse extends SuccessResponse {
  constructor(partial: Partial<UnpauseMileageTokenResponse>) {
    super();
    Object.assign(this, partial);
  }
}
