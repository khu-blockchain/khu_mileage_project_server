import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageController } from './mileage.controller';
import { FileModule } from '@/shared/modules/file/file.module';
import { MileageRepository } from './repository/mileage.repository';
import { MileageFileRepository } from './repository/mileage-file.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mileage } from './entities/mileage.entity';
import { MileageFile } from './entities/mileage-file.entity';
import { ConfigModule } from '@nestjs/config';
import { KaiaModule } from '../kaia/kaia.module';
import { StudentModule } from '../student/student.module';
import { MileageRubricModule } from '../mileage-rubric/mileage-rubric.module';
import { MileagePointHistoryModule } from '../mileage-point-history/mileage-point-history.module';
import { MileageTokenModule } from '../mileage-token/mileage-token.module';

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
