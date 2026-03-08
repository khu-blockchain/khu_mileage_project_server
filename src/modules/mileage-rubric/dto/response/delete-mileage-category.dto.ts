import { SuccessResponse } from '@/shared/dtos';

export class DeleteMileageCategoryResponse extends SuccessResponse {
  constructor(partial: Partial<DeleteMileageCategoryResponse>) {
    super();
    Object.assign(this, partial);
  }
}
