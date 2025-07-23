import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from '@/config/config.module';
import { KaiaModule } from '@/modules/kaia/kaia.module';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { AdminService } from '@/modules/admin/admin.service';
import { AdminController } from '@/modules/admin/admin.controller';
import { AdminRepository } from '@/modules/admin/repository/admin.repository';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([Admin]), KaiaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
