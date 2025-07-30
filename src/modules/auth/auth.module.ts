import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AppConfigModule } from '@/config/config.module';
import { AdminModule } from '@/modules/admin/admin.module';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { STRATEGY_JWT_AUTH } from '@/modules/auth/constants/strategy.constant';
import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { JwtRefreshStrategy } from '@/modules/auth/strategies/jwt-refresh.strategy';
import { StudentModule } from '@/modules/student/student.module';

@Module({
  imports: [
    StudentModule,
    AdminModule,
    AppConfigModule,
    PassportModule.register({ defaultStrategy: STRATEGY_JWT_AUTH }),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        publicKey: configService.get<string>('jwt.publicKey'),
        privateKey: configService.get<string>('jwt.privateKey'),
        signOptions: {
          algorithm: 'RS256',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
