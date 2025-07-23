import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MileageTokenService } from '@/modules/mileage-token/mileage-token.service';
import {
  CreateMileageTokenRequest,
  ActivateMileageTokenRequest,
  ActivateMileageTokenResponse,
} from '@/modules/mileage-token/dto';
import { JwtAuthGuard, RolesGuard } from '@/modules/auth/guards';
import { Role } from '@/modules/auth/constants/role.constants';
import { Roles } from '@/modules/auth/decorators';
import { BaseApiResponse } from '@/shared/dtos';
import { MileageToken } from '@/modules/mileage-token/entities/mileage-token.entity';
import { Hex } from '@kaiachain/viem-ext';
import { plainToInstance } from 'class-transformer';
import { BaseMileageTokenDto } from './dto/response/base-mileage-token.dto';

@Controller('mileage-token')
export class MileageTokenController {
  constructor(private readonly mileageTokenService: MileageTokenService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() input: CreateMileageTokenRequest): Promise<BaseApiResponse<MileageToken>> {
    const result = await this.mileageTokenService.create(input);
    return {
      data: result,
      meta: {},
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll(): Promise<BaseApiResponse<MileageToken[]>> {
    const result = await this.mileageTokenService.findAll();
    return {
      data: result,
      meta: {},
    };
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async activate(
    @Param('id') id: number,
    @Body() input: ActivateMileageTokenRequest,
  ): Promise<BaseApiResponse<ActivateMileageTokenResponse>> {
    const result = await this.mileageTokenService.activate(id, input);
    return {
      data: result,
      meta: {},
    };
  }

  @Get(':contractAddress')
  async getMileageTokenByContractAddress(
    @Param('contractAddress') contractAddress: Hex,
  ): Promise<BaseApiResponse<BaseMileageTokenDto>> {
    const result = await this.mileageTokenService.getMileageTokenByContractAddress(contractAddress);
    return {
      data: plainToInstance(BaseMileageTokenDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }
}
