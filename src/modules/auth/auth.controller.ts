import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { Response } from 'express';
import { AuthUserContext } from './auth.types';
import { CookieInterceptor } from '@/shared/interceptors/cookie.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { AuthStudentDto, StudentLoginRequest } from './dto';
import { AdminLoginRequest } from './dto/request/admin-login.dto';
import { AuthAdminDto } from './dto/response/auth-admin.dto';

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
      data: result,
      meta: {},
    };
  }

  @Post('/login/admin')
  @UseInterceptors(CookieInterceptor)
  async adminLogin(@Body() request: AdminLoginRequest): Promise<BaseApiResponse<AuthAdminDto>> {
    const result = await this.authService.adminLogin(request);

    return {
      data: result,
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

    return {
      data: result,
      meta: {},
    };
  }

  // @Post('/logout')
  // @UseGuards(JwtAuthGuard)
  // async logout(@Res({ passthrough: true }) res: Response) {
  //   res.clearCookie('refreshToken');
  //   return {
  //     data: {
  //       success: true,
  //     },
  //     meta: {},
  //   };
  // }
}
