import { Body, Controller, Post, UseGuards, UseInterceptors, Res } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Response } from 'express';

import { BaseApiResponse } from '@/shared/dtos';
import { CookieInterceptor } from '@/shared/interceptors/cookie.interceptor';

import { AuthService } from './auth.service';
import { AuthUserContext } from './auth.types';
import { Role } from './constants/role.constants';
import { CurrentUser } from './decorators';
import { AuthStudentDto, StudentLoginRequest } from './dto';
import { AdminLoginRequest } from './dto/request/admin-login.dto';
import { AuthAdminDto } from './dto/response/auth-admin.dto';
import { JwtRefreshGuard, JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login/student')
  @UseInterceptors(CookieInterceptor)
  async studentLogin(
    @Body() request: StudentLoginRequest,
  ): Promise<BaseApiResponse<AuthStudentDto>> {
    const result = await this.authService.studentLogin(request);

    return {
      data: plainToInstance(AuthStudentDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }

  @Post('/login/admin')
  @UseInterceptors(CookieInterceptor)
  async adminLogin(@Body() request: AdminLoginRequest): Promise<BaseApiResponse<AuthAdminDto>> {
    const result = await this.authService.adminLogin(request);

    return {
      data: plainToInstance(AuthAdminDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }

  @Post('/refresh')
  @UseGuards(JwtRefreshGuard)
  @UseInterceptors(CookieInterceptor)
  async refreshToken(
    @CurrentUser() user: AuthUserContext,
  ): Promise<BaseApiResponse<AuthStudentDto | AuthAdminDto>> {
    const result = await this.authService.refreshToken(user);

    if (user.role === Role.STUDENT) {
      return {
        data: plainToInstance(AuthStudentDto, result, {
          excludeExtraneousValues: true,
        }),
        meta: {},
      };
    }
    return {
      data: plainToInstance(AuthAdminDto, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('khu-sw-mileage-refresh');
    return {
      data: {
        success: true,
      },
      meta: {},
    };
  }
}
