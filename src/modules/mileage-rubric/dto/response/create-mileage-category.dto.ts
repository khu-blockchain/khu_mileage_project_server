import { Expose } from 'class-transformer';

export class CreateMileageCategoryResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;
}
