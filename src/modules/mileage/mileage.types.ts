import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { Student } from '@/modules/student/entities/student.entity';
import { TRANSACTION_STATUS } from '@/shared/constants/enums';

import { MILEAGE_STATUS } from './constants/mileage-status.enum';
import { Mileage } from './entities/mileage.entity';

export type CreateMileageInitParams = {
  mileage_category_name: string;
  mileage_activity_name: string;
  mileage_description: string;
  doc_hash: string;
  status: MILEAGE_STATUS;
  transaction_status: TRANSACTION_STATUS;
  student: Student;
  mileage_activity: MileageActivity;
};

export type CreateMileageFileParams = {
  mileage: Mileage;
  original_file_name: string;
  stored_file_name: string;
  url: string;
};

export type GetMileagesParams = {
  take: number;
  skip: number;
  student_id?: string;
  status?: MILEAGE_STATUS;
};
