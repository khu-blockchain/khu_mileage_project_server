import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

import { JwtPayload } from '@/modules/auth/auth.types';
import { STRATEGY_JWT_REFRESH } from '@/modules/auth/constants/strategy.constant';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['khu-sw-mileage-refresh'];
  }
  return null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, STRATEGY_JWT_REFRESH) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: cookieExtractor,
      secretOrKey: configService.getOrThrow<string>('jwt.publicKey'),
    });
  }

  async validate(payload: JwtPayload) {
    return { ...payload.sub };
  }
}
