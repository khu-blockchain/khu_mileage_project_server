import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';
import { CreateMileageCategoryParam } from '@/modules/mileage-rubric/mileage-rubric.types';

@Injectable()
export class MileageCategoryRepository extends Repository<MileageCategory> {
  constructor(private dataSource: DataSource) {
    super(MileageCategory, dataSource.createEntityManager());
  }

  async createCategory(data: CreateMileageCategoryParam): Promise<MileageCategory> {
    const newCategory = this.create(data);
    return this.save(newCategory);
  }

  async findCategoryById(id: number): Promise<MileageCategory | null> {
    const category = await this.findOneBy({ id });
    return category;
  }

  async updateCategory(
    id: number,
    data: Partial<CreateMileageCategoryParam>,
  ): Promise<MileageCategory> {
    const category = await this.findCategoryById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return this.save({ ...category, ...data });
  }

  async deleteCategory(id: number): Promise<void> {
    const result = await this.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }
  }

  async findAllWithActivities(): Promise<MileageCategory[]> {
    return this.find({
      relations: ['mileage_activities'],
      order: {
        id: 'ASC',
      },
    });
  }
}
