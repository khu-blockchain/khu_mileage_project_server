import { Expose } from 'class-transformer';

export class DeleteMileageCategoryResponse {
  @Expose()
  success: boolean;
}
