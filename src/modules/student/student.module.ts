import { Module, forwardRef } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentRepository } from './repository/student.repository';
import { KaiaModule } from '../kaia/kaia.module';
import { AppConfigModule } from '@/config/config.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forFeature([Student]),
    KaiaModule,
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository],
  exports: [StudentService],
})
export class StudentModule {}
