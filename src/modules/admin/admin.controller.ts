import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { AdminJwtPayload } from '@/modules/auth/auth.types';
import { Role } from '@/modules/auth/constants/role.constants';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import { BaseApiResponse } from '@/shared/dtos';

import { AdminService } from './admin.service';
import { BaseAdminDto, CreateAdminRequest, UpdateEmailRequest } from './dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createAdmin(@Body() request: CreateAdminRequest): Promise<BaseApiResponse<BaseAdminDto>> {
    const newAdminEntity = await this.adminService.createAdmin(request);

    const result = plainToInstance(BaseAdminDto, newAdminEntity, {
      excludeExtraneousValues: true,
    });

    return {
      data: result,
      meta: {},
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('email')
  async updateEmail(
    @CurrentUser() admin: AdminJwtPayload,
    @Body() request: UpdateEmailRequest,
  ): Promise<BaseApiResponse<BaseAdminDto>> {
    const updatedAdminEntity = await this.adminService.updateEmail(admin.admin_id, request);

    return {
      data: plainToInstance(BaseAdminDto, updatedAdminEntity, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }
}
