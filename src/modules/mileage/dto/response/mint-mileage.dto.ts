import { SuccessResponse } from '@/shared/dtos';

export class MintMileageResponse extends SuccessResponse {
  constructor(partial: Partial<MintMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
