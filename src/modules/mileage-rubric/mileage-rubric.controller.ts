import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { Role } from '@/modules/auth/constants/role.constants';
import { Roles } from '@/modules/auth/decorators';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import {
  CreateMileageActivityRequest,
  CreateMileageActivityResponse,
  CreateMileageCategoryRequest,
  CreateMileageCategoryResponse,
  DeleteMileageActivityResponse,
  DeleteMileageCategoryResponse,
  GetRubricResponse,
  UpdateMileageActivityRequest,
  UpdateMileageActivityResponse,
  UpdateMileageCategoryRequest,
  UpdateMileageCategoryResponse,
} from '@/modules/mileage-rubric/dto';
import { MileageRubricService } from '@/modules/mileage-rubric/mileage-rubric.service';
import { BaseApiResponse } from '@/shared/dtos';

@Controller('mileage-rubric')
export class MileageRubricController {
  constructor(private readonly mileageRubricService: MileageRubricService) {}

  @Post('category')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createCategory(
    @Body() input: CreateMileageCategoryRequest,
  ): Promise<BaseApiResponse<CreateMileageCategoryResponse>> {
    const result = await this.mileageRubricService.createCategory(input);

    return {
      data: plainToInstance(CreateMileageCategoryResponse, result),
      meta: {},
    };
  }

  // TODO: 마일리지 세부 항목 생성 API
  @Post('activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async createActivity(
    @Body() input: CreateMileageActivityRequest,
  ): Promise<BaseApiResponse<CreateMileageActivityResponse>> {
    const result = await this.mileageRubricService.createActivity(input);

    return {
      data: plainToInstance(CreateMileageActivityResponse, result),
      meta: {},
    };
  }

  // TODO: 마일리지 항목 카테고리 수정 API
  @Patch('category/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateCategory(
    @Param('id') id: number,
    @Body() input: UpdateMileageCategoryRequest,
  ): Promise<BaseApiResponse<UpdateMileageCategoryResponse>> {
    const result = await this.mileageRubricService.updateCategory(id, input);
    return {
      data: plainToInstance(UpdateMileageCategoryResponse, result),
      meta: {},
    };
  }

  // TODO: 마일리지 세부 항목 수정 API
  @Patch('activity/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateActivity(
    @Param('id') id: number,
    @Body() input: UpdateMileageActivityRequest,
  ): Promise<BaseApiResponse<UpdateMileageActivityResponse>> {
    const result = await this.mileageRubricService.updateActivity(id, input);
    return {
      data: plainToInstance(UpdateMileageActivityResponse, result),
      meta: {},
    };
  }

  @Delete('category/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteCategory(
    @Param('id') id: number,
  ): Promise<BaseApiResponse<DeleteMileageCategoryResponse>> {
    const result = await this.mileageRubricService.deleteCategory(id);

    return {
      data: plainToInstance(DeleteMileageCategoryResponse, result),
      meta: {},
    };
  }

  // TODO: 마일리지 세부 항목 삭제 API
  @Delete('activity/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async deleteActivity(
    @Param('id') id: number,
  ): Promise<BaseApiResponse<DeleteMileageActivityResponse>> {
    const result = await this.mileageRubricService.deleteActivity(id);

    return {
      data: plainToInstance(DeleteMileageActivityResponse, result),
      meta: {},
    };
  }

  // TODO: 마일리지 전체 항목 조회 API
  @Get()
  async getRubric(): Promise<BaseApiResponse<GetRubricResponse[]>> {
    const result = await this.mileageRubricService.getRubric();
    return {
      data: plainToInstance(GetRubricResponse, result),
      meta: {},
    };
  }
}
