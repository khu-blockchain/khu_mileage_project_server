import { SuccessResponse } from '@/shared/dtos';

export class RejectMileageResponse extends SuccessResponse {
  constructor(partial: Partial<RejectMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
