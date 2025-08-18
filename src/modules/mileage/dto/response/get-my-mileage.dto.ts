import { Expose } from 'class-transformer';

import { BaseMileageDto } from './base-mileage.dto';
import { MileagePointHistory } from '@/modules/mileage-point-history/entities/mileage-point-history.entity';

export class GetMyMileageResponse extends BaseMileageDto {
  constructor(partial: Partial<GetMyMileageResponse>) {
    super();
    Object.assign(this, partial);
  }

  @Expose()
  mileage_point_histories: MileagePointHistory[];
}
