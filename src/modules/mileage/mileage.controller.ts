import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';

import { StudentJwtPayload } from '@/modules/auth/auth.types';
import { Role } from '@/modules/auth/constants/role.constants';
import { CurrentUser, Roles } from '@/modules/auth/decorators';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import {
  ApproveMileageRequest,
  ApproveMileageResponse,
  BaseMileageDto,
  BurnMileageRequest,
  BurnMileageResponse,
  CreateMileageRequest,
  CreateMileageResponse,
  GetMileageResponse,
  GetMileagesRequest,
  GetMyMileageResponse,
  MintMileageRequest,
  MintMileageResponse,
  RejectMileageRequest,
  RejectMileageResponse,
} from '@/modules/mileage/dto';
import { BaseApiResponse } from '@/shared/dtos';

import { MileageService } from './mileage.service';

@Controller('mileage')
export class MileageController {
  constructor(private readonly mileageService: MileageService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @UseInterceptors(FilesInterceptor('mileageFiles'))
  async creatMileage(
    @UploadedFiles() mileageFiles: Express.Multer.File[],
    @Body() input: CreateMileageRequest,
  ): Promise<BaseApiResponse<CreateMileageResponse>> {
    const response = await this.mileageService.create(input, mileageFiles);

    return {
      data: plainToInstance(CreateMileageResponse, response),
      meta: {},
    };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getMyMileages(
    @CurrentUser() user: StudentJwtPayload,
  ): Promise<BaseApiResponse<BaseMileageDto[]>> {
    const response = await this.mileageService.getMyMileages(user.student_id);

    return {
      data: plainToInstance(BaseMileageDto, response),
      meta: {},
    };
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getMyMileageDetail(
    @Param('id') id: number,
    @CurrentUser() user: StudentJwtPayload,
  ): Promise<BaseApiResponse<GetMyMileageResponse>> {
    const mileage = await this.mileageService.getMyMileageDetail(id, user);

    return {
      data: plainToInstance(GetMyMileageResponse, mileage),
      meta: {},
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getMileages(
    @Query() query: GetMileagesRequest,
  ): Promise<BaseApiResponse<BaseMileageDto[]>> {
    const { mileages, total } = await this.mileageService.getMileages(query);

    return {
      data: plainToInstance(BaseMileageDto, mileages),
      meta: {
        total,
        ...(!query.all && { lastPage: Math.ceil(total / query.limit) }),
      },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getMileageDetail(@Param('id') id: number): Promise<BaseApiResponse<GetMileageResponse>> {
    const mileage = await this.mileageService.getMileageDetail(id);

    return {
      data: plainToInstance(GetMileageResponse, mileage),
      meta: {},
    };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveMileage(
    @Param('id') id: number,
    @Body() body: ApproveMileageRequest,
  ): Promise<BaseApiResponse<ApproveMileageResponse>> {
    const response = await this.mileageService.approveMileage(id, body);

    return {
      data: plainToInstance(ApproveMileageResponse, response),
      meta: {},
    };
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async rejectMileage(
    @Param('id') id: number,
    @Body() body: RejectMileageRequest,
  ): Promise<BaseApiResponse<RejectMileageResponse>> {
    const response = await this.mileageService.rejectMileage(id, body);

    return {
      data: plainToInstance(RejectMileageResponse, response),
      meta: {},
    };
  }

  @Post(':id/mint')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async mintMileage(
    @Param('id') id: number,
    @Body() body: MintMileageRequest,
  ): Promise<BaseApiResponse<MintMileageResponse>> {
    const response = await this.mileageService.mintMileage(id, body);

    return {
      data: plainToInstance(MintMileageResponse, response),
      meta: {},
    };
  }

  @Post(':id/burn')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async burnMileage(
    @Param('id') id: number,
    @Body() body: BurnMileageRequest,
  ): Promise<BaseApiResponse<BurnMileageResponse>> {
    const response = await this.mileageService.burnMileage(id, body);

    return {
      data: plainToInstance(BurnMileageResponse, response),
      meta: {},
    };
  }
}
