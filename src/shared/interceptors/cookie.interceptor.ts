import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseApiResponse } from '../dtos/base-api-response.dto';

export interface ResponseWithRefreshToken extends BaseApiResponse<any> {
  data: {
    refreshToken?: string;
  } & any;
}

@Injectable()
export class CookieInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res: ResponseWithRefreshToken) => {
        const response = context.switchToHttp().getResponse<Response>();
        const data = res.data;
        if (data && data.refresh_token) {
          const refreshToken = data.refresh_token;
          const expiresIn = this.configService.getOrThrow<number>('jwt.refreshTokenExpiresInSec');

          response.cookie('khu-sw-mileage-refresh', refreshToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
            maxAge: expiresIn * 1000, // ms
          });

          // 응답 객체에서 refreshToken 제거
          delete data.refresh_token;
        }
        return res;
      }),
    );
  }
}
