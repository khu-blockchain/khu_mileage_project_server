import { SuccessResponse } from '@/shared/dtos';

export class DeleteMileageActivityResponse extends SuccessResponse {
  constructor(partial: Partial<DeleteMileageActivityResponse>) {
    super();
    Object.assign(this, partial);
  }
}
