import { Expose } from 'class-transformer';
import { POINT_TYPE } from '@/modules/mileage-rubric/constants/point-type.enum';

export class CreateMileageActivityResponse {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  point_type: POINT_TYPE;

  @Expose()
  point_description: string | null;

  @Expose()
  fixed_point: number | null;
}
