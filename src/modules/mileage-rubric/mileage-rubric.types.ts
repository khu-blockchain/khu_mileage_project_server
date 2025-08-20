import { MileageCategory } from './entities/mileage-category.entity';
import { POINT_TYPE } from './constants/point-type.enum';

export type CreateMileageCategoryParam = {
  name: string;
  description: string;
};

export type CreateMileageActivityParam = {
  name: string;
  point_type: POINT_TYPE;
  point_description: string;
  fixed_point?: number;
  mileage_category: MileageCategory;
};

export type UpdateMileageCategoryParam = {
  name: string;
  description?: string;
};

export type UpdateMileageActivityParam = {
  mileage_category: MileageCategory;
  name: string;
  point_type: POINT_TYPE;
  point_description: string;
  fixed_point?: number;
};
