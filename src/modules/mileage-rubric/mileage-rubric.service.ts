import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateMileageCategoryRequest,
  CreateMileageActivityRequest,
  DeleteMileageCategoryResponse,
  DeleteMileageActivityResponse,
} from '@/modules/mileage-rubric/dto';
import { MileageCategoryRepository } from '@/modules/mileage-rubric/repository/mileage-category.repository';
import { MileageActivityRepository } from '@/modules/mileage-rubric/repository/mileage-activity.repository';
import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';
import {
  CreateMileageActivityParam,
  CreateMileageCategoryParam,
  UpdateMileageActivityParam,
  UpdateMileageCategoryParam,
} from '@/modules/mileage-rubric/mileage-rubric.types';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { POINT_TYPE } from '@/modules/mileage-rubric/constants/point-type.enum';

@Injectable()
export class MileageRubricService {
  constructor(
    private mileageCategoryRepository: MileageCategoryRepository,
    private mileageActivityRepository: MileageActivityRepository,
  ) {}

  async createCategory(input: CreateMileageCategoryRequest): Promise<MileageCategory> {
    const categoryParams: CreateMileageCategoryParam = {
      name: input.name,
      description: input.description,
    };
    return await this.mileageCategoryRepository.createCategory(categoryParams);
  }

  async createActivity(input: CreateMileageActivityRequest): Promise<MileageActivity> {
    const category = await this.mileageCategoryRepository.findCategoryById(
      input.mileage_category_id,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.validateActivityFixedPoint(input.point_type, input.fixed_point);

    const activityParams: CreateMileageActivityParam = {
      name: input.name,
      point_type: input.point_type,
      point_description: input.point_description,
      fixed_point: input.fixed_point,
      mileage_category_id: input.mileage_category_id,
    };

    return await this.mileageActivityRepository.createActivity(activityParams);
  }

  async findActivityById(id: number): Promise<MileageActivity | null> {
    return this.mileageActivityRepository.findActivityById(id);
  }

  async findCategoryById(id: number): Promise<MileageCategory | null> {
    return this.mileageCategoryRepository.findCategoryById(id);
  }

  async updateCategory(id: number, input: UpdateMileageCategoryParam): Promise<MileageCategory> {
    return this.mileageCategoryRepository.updateCategory(id, input);
  }

  async updateActivity(id: number, input: UpdateMileageActivityParam): Promise<MileageActivity> {
    const category = await this.mileageCategoryRepository.findCategoryById(
      input.mileage_category_id,
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    this.validateActivityFixedPoint(input.point_type, input.fixed_point);

    return this.mileageActivityRepository.updateActivity(id, input);
  }

  async deleteCategory(id: number): Promise<DeleteMileageCategoryResponse> {
    await this.mileageCategoryRepository.deleteCategory(id);
    return {
      success: true,
    };
  }

  async deleteActivity(id: number): Promise<DeleteMileageActivityResponse> {
    await this.mileageActivityRepository.deleteActivity(id);
    return {
      success: true,
    };
  }

  async getRubric(): Promise<MileageCategory[]> {
    return this.mileageCategoryRepository.findAllWithActivities();
  }

  private validateActivityFixedPoint(point_type: POINT_TYPE, fixed_point: number | undefined) {
    if (point_type === POINT_TYPE.FIXED && fixed_point === null) {
      throw new BadRequestException('Fixed point is required');
    }
  }
}
