import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { POINT_TYPE } from '@/modules/mileage-rubric/constants/point-type.enum';
import {
  CreateMileageActivityRequest,
  CreateMileageCategoryRequest,
  DeleteMileageActivityResponse,
  DeleteMileageCategoryResponse,
  UpdateMileageActivityRequest,
  UpdateMileageCategoryRequest,
} from '@/modules/mileage-rubric/dto';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';
import {
  CreateMileageActivityParam,
  CreateMileageCategoryParam,
  UpdateMileageActivityParam,
  UpdateMileageCategoryParam,
} from '@/modules/mileage-rubric/mileage-rubric.types';
import { MileageActivityRepository } from '@/modules/mileage-rubric/repository/mileage-activity.repository';
import { MileageCategoryRepository } from '@/modules/mileage-rubric/repository/mileage-category.repository';

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
    const category = await this.mileageCategoryRepository.findCategoryById(input.mileageCategoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (input.pointType === POINT_TYPE.FIXED && input.fixedPoint === null) {
      throw new BadRequestException('Fixed point is required');
    }

    const activityParams: CreateMileageActivityParam = {
      name: input.name,
      point_type: input.pointType,
      point_description: input.pointDescription,
      fixed_point: input.fixedPoint,
      mileage_category: category,
    };

    return await this.mileageActivityRepository.createActivity(activityParams);
  }

  async findActivityById(id: number): Promise<MileageActivity | null> {
    return this.mileageActivityRepository.findActivityById(id);
  }

  async findCategoryById(id: number): Promise<MileageCategory | null> {
    return this.mileageCategoryRepository.findCategoryById(id);
  }

  async updateCategory(id: number, input: UpdateMileageCategoryRequest): Promise<MileageCategory> {
    const categoryParams: UpdateMileageCategoryParam = {
      name: input.name,
      description: input.description,
    };
    return this.mileageCategoryRepository.updateCategory(id, categoryParams);
  }

  async updateActivity(
    id: number,
    input: UpdateMileageActivityRequest,
  ): Promise<{ success: boolean }> {
    const category = await this.mileageCategoryRepository.findCategoryById(input.mileageCategoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (input.pointType === POINT_TYPE.FIXED && input.fixedPoint === null) {
      throw new BadRequestException('Fixed point is required');
    }

    const activityParams: UpdateMileageActivityParam = {
      mileage_category: category,
      name: input.name,
      point_type: input.pointType,
      point_description: input.pointDescription,
      fixed_point: input.pointType === POINT_TYPE.FIXED ? input.fixedPoint : null,
    };

    await this.mileageActivityRepository.updateActivity(id, activityParams);
    return {
      success: true,
    };
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
}
