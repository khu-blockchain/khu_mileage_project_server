import { SuccessResponse } from '@/shared/dtos/success-response.dto';

export class RejectMileageResponse extends SuccessResponse {
  constructor(partial: Partial<RejectMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
