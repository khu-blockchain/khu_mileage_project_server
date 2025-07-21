import { Expose } from 'class-transformer';

export class DeleteMileageActivityResponse {
  @Expose()
  success: boolean;
}