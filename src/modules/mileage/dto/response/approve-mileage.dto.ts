import { SuccessResponse } from '@/shared/dtos/success-response.dto';

export class ApproveMileageResponse extends SuccessResponse {
  constructor(partial: Partial<ApproveMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
