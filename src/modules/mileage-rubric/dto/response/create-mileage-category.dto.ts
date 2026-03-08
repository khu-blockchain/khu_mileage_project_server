import { Expose } from 'class-transformer';

export class CreateMileageCategoryResponse {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;
}
