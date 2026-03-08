import { SuccessResponse } from '@/shared/dtos';

export class ApproveMileageResponse extends SuccessResponse {
  constructor(partial: Partial<ApproveMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
