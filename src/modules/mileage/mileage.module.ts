import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KaiaModule } from '@/modules/kaia/kaia.module';
import { MileagePointHistoryModule } from '@/modules/mileage-point-history/mileage-point-history.module';
import { MileageRubricModule } from '@/modules/mileage-rubric/mileage-rubric.module';
import { MileageTokenModule } from '@/modules/mileage-token/mileage-token.module';
import { StudentModule } from '@/modules/student/student.module';
import { FileModule } from '@/shared/modules/file/file.module';

import { Mileage } from './entities/mileage.entity';
import { MileageFile } from './entities/mileage-file.entity';
import { MileageController } from './mileage.controller';
import { MileageService } from './mileage.service';
import { MileageRepository } from './repository/mileage.repository';
import { MileageFileRepository } from './repository/mileage-file.repository';

@Module({
  imports: [
    FileModule,
    TypeOrmModule.forFeature([Mileage, MileageFile]),
    ConfigModule,
    KaiaModule,
    StudentModule,
    MileageRubricModule,
    MileagePointHistoryModule,
    MileageTokenModule,
  ],
  controllers: [MileageController],
  providers: [MileageService, MileageRepository, MileageFileRepository],
  exports: [MileageService],
})
export class MileageModule {}
