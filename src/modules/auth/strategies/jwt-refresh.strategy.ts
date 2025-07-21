import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { STRATEGY_JWT_REFRESH } from '../constants/strategy.constant';
import { Request } from 'express';
import { JwtPayload } from '../auth.types';

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