import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import {
  CreateMileageActivityParam,
  UpdateMileageActivityParam,
} from '@/modules/mileage-rubric/mileage-rubric.types';

@Injectable()
export class MileageActivityRepository extends Repository<MileageActivity> {
  constructor(private dataSource: DataSource) {
    super(MileageActivity, dataSource.createEntityManager());
  }

  async createActivity(data: CreateMileageActivityParam): Promise<MileageActivity> {
    const newActivity = this.create(data);
    return this.save(newActivity);
  }

  async findActivityById(id: number): Promise<MileageActivity | null> {
    return this.findOneBy({ id });
  }

  async updateActivity(id: number, data: UpdateMileageActivityParam): Promise<MileageActivity> {
    const activity = await this.findActivityById(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    return this.save({ ...activity, ...data });
  }

  async deleteActivity(id: number): Promise<void> {
    const result = await this.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }
  }
}
