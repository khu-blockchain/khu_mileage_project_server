import { Expose } from 'class-transformer';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';

export class GetRubricResponse {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  mileage_activities: MileageActivity[];
}
