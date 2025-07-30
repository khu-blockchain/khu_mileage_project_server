import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';
import { MileageRubricController } from '@/modules/mileage-rubric/mileage-rubric.controller';
import { MileageRubricService } from '@/modules/mileage-rubric/mileage-rubric.service';
import { MileageActivityRepository } from '@/modules/mileage-rubric/repository/mileage-activity.repository';
import { MileageCategoryRepository } from '@/modules/mileage-rubric/repository/mileage-category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MileageCategory, MileageActivity])],
  controllers: [MileageRubricController],
  providers: [MileageRubricService, MileageCategoryRepository, MileageActivityRepository],
  exports: [MileageRubricService],
})
export class MileageRubricModule {}
