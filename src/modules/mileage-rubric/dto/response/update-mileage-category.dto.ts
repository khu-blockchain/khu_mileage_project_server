import { Expose } from 'class-transformer';

export class UpdateMileageCategoryResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;
}
