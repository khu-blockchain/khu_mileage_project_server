import { SuccessResponse } from '@/shared/dtos';

export class ActivateMileageTokenResponse extends SuccessResponse {
  constructor(partial: Partial<ActivateMileageTokenResponse>) {
    super();
    Object.assign(this, partial);
  }
}
