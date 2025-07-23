import { SuccessResponse } from '@/shared/dtos';

export class BurnMileageResponse extends SuccessResponse {
  constructor(partial: Partial<BurnMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
