import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WalletLostService } from './wallet-lost.service';
import {
  ApproveWalletLostRequest,
  CheckHasPendingWalletLostResponse,
  CreateWalletLostRequest,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/constants/role.constants';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentJwtPayload } from '../auth/auth.types';
import { plainToInstance } from 'class-transformer';
import { CreateWalletLostResponse } from './dto/response/create-wallet-lost.dto';
import { GetWalletLostListRequest } from './dto/request/get-wallet-lost.dto';
import { BaseWalletLost } from './dto/response/base-wallet-lost.dto';

@Controller('wallet-lost')
export class WalletLostController {
  constructor(private readonly walletLostService: WalletLostService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async createWalletLost(
    @CurrentUser() user: StudentJwtPayload,
    @Body() request: CreateWalletLostRequest,
  ) {
    const { student_id } = user;
    const result = await this.walletLostService.createWalletLost(student_id, request);

    return {
      data: plainToInstance(CreateWalletLostResponse, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }

  @Get('/check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async checkHasPendingWalletLost(@CurrentUser() user: StudentJwtPayload) {
    const { student_id } = user;
    const { hasPendingWalletLost, data } =
      await this.walletLostService.checkHasPendingWalletLost(student_id);

    return {
      result: hasPendingWalletLost,
      data: data
        ? plainToInstance(CheckHasPendingWalletLostResponse, data, {
            excludeExtraneousValues: true,
          })
        : null,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getWalletLostList(@Query() query: GetWalletLostListRequest) {
    const { walletLosts, total } = await this.walletLostService.getWalletLostList(query);
    return {
      data: plainToInstance(BaseWalletLost, walletLosts, {
        excludeExtraneousValues: true,
      }),
      meta: {
        total,
        lastPage: Math.ceil(total / query.limit),
      },
    };
  }

  @Post('approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async approveWalletLost(@Body() request: ApproveWalletLostRequest) {
    const result = await this.walletLostService.approveWalletLost(request);
    return {
      data: result,
    };
  }
}
