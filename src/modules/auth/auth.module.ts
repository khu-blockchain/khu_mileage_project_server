import { Module } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthStrategy } from '@/modules/auth/strategies/jwt-auth.strategy';
import { AppConfigModule } from '@/config/config.module';
import { STRATEGY_JWT_AUTH } from '@/modules/auth/constants/strategy.constant';
import { JwtRefreshStrategy } from '@/modules/auth/strategies/jwt-refresh.strategy';
import { StudentModule } from '@/modules/student/student.module';
import { AdminModule } from '@/modules/admin/admin.module';

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
