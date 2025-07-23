import { Expose } from 'class-transformer';

import { TRANSACTION_STATUS } from '@/shared/constants/enums/transaction-status.enum';
import { Student } from '@/modules/student/entities/student.entity';

import { MILEAGE_STATUS } from '../../constants/mileage-status.enum';
import { MileageFile } from '../../entities/mileage-file.entity';

export class BaseMileageDto {
  @Expose()
  id: number;

  @Expose()
  mileage_category_name: string;

  @Expose()
  mileage_activity_name: string;

  @Expose()
  mileage_description: string;

  @Expose()
  admin_comment: string | null;

  @Expose()
  doc_index: number | null;

  @Expose()
  doc_hash: string | null;

  @Expose()
  status: MILEAGE_STATUS;

  @Expose()
  transaction_status: TRANSACTION_STATUS;

  @Expose()
  created_at: Date;

  @Expose()
  updated_at: Date;

  @Expose()
  student: Student;

  @Expose()
  mileage_files: MileageFile[];
}
