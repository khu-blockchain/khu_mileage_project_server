import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppConfigModule } from '@/config/config.module';
import { AdminController } from '@/modules/admin/admin.controller';
import { AdminService } from '@/modules/admin/admin.service';
import { Admin } from '@/modules/admin/entities/admin.entity';
import { AdminRepository } from '@/modules/admin/repository/admin.repository';
import { KaiaModule } from '@/modules/kaia/kaia.module';

@Module({
  imports: [AppConfigModule, TypeOrmModule.forFeature([Admin]), KaiaModule],
  controllers: [AdminController],
  providers: [AdminService, AdminRepository],
  exports: [AdminService],
})
export class AdminModule {}
