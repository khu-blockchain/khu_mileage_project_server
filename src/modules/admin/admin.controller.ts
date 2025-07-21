import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminRequest, BaseAdminDto, UpdateEmailRequest } from './dto';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/constants/role.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminJwtPayload } from '@/modules/auth/auth.types';

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
