import { SuccessResponse } from '@/shared/dtos/success-response.dto';

export class MintMileageResponse extends SuccessResponse {
  constructor(partial: Partial<MintMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
