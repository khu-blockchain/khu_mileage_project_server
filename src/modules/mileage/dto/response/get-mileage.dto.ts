import { BaseMileageDto } from './base-mileage.dto';

export class GetMileageResponse extends BaseMileageDto {
  constructor(partial: Partial<GetMileageResponse>) {
    super();
    Object.assign(this, partial);
  }
}
