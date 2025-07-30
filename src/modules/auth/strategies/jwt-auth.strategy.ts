import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload } from '@/modules/auth/auth.types';
import { STRATEGY_JWT_AUTH } from '@/modules/auth/constants/strategy.constant';

@Injectable()
export class JwtAuthStrategy extends PassportStrategy(Strategy, STRATEGY_JWT_AUTH) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('jwt.publicKey'),
    });
  }

  async validate(payload: JwtPayload) {
    return { ...payload.sub };
  }
}
