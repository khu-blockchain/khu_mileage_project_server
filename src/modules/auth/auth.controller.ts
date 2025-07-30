import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';

import { BaseApiResponse } from '@/shared/dtos';
import { CookieInterceptor } from '@/shared/interceptors/cookie.interceptor';

import { AuthService } from './auth.service';
import { AuthUserContext } from './auth.types';
import { CurrentUser } from './decorators';
import { AuthStudentDto, StudentLoginRequest } from './dto';
import { AdminLoginRequest } from './dto/request/admin-login.dto';
import { AuthAdminDto } from './dto/response/auth-admin.dto';
import { JwtRefreshGuard } from './guards';

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
