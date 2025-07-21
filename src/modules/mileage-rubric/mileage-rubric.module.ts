import { Module, forwardRef } from '@nestjs/common';
import { MileageRubricService } from '@/modules/mileage-rubric/mileage-rubric.service';
import { MileageRubricController } from '@/modules/mileage-rubric/mileage-rubric.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MileageCategory } from '@/modules/mileage-rubric/entities/mileage-category.entity';
import { MileageActivity } from '@/modules/mileage-rubric/entities/mileage-activity.entity';
import { MileageCategoryRepository } from '@/modules/mileage-rubric/repository/mileage-category.repository';
import { MileageActivityRepository } from '@/modules/mileage-rubric/repository/mileage-activity.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MileageCategory, MileageActivity])],
  controllers: [MileageRubricController],
  providers: [MileageRubricService, MileageCategoryRepository, MileageActivityRepository],
  exports: [MileageRubricService],
})
export class MileageRubricModule {}
