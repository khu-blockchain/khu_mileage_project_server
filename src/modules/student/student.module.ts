import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from '@/config/config.module';

import { KaiaModule } from '../kaia/kaia.module';
import { Student } from './entities/student.entity';
import { StudentRepository } from './repository/student.repository';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([Student]), KaiaModule],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService],
})
export class StudentModule {}
