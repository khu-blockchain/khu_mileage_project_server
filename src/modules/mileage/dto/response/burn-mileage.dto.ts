import { SuccessResponse } from '@/shared/dtos/success-response.dto';

export class BurnMileageResponse extends SuccessResponse {
  constructor(partial: Partial<BurnMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
