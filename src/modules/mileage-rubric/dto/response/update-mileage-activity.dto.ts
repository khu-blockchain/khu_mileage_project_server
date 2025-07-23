import { SuccessResponse } from '@/shared/dtos';

export class UpdateMileageActivityResponse extends SuccessResponse {
  constructor(partial: Partial<UpdateMileageActivityResponse>) {
    super();
    Object.assign(this, partial);
  }
}