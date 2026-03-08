import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { AppConfigModule } from '@/config/config.module';

@Module({
    imports: [
        AppConfigModule,
        MailerModule.forRootAsync({
            imports: [AppConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST'), // 이메일을 보낼 SMTP 서버의 주소
                    port: config.get<string>('MAIL_PORT'), // SMTP 서버의 포트 번호
                    auth: {
                        user: config.get<string>('MAIL_USER'), // SMTP 서버 인증을 위한 이메일
                        pass: config.get<string>('MAIL_PASSWORD') // SMTP 서버 인증을 위한 비밀번호
                    }
                },
                defaults: {
                    from: 'KHU 관리자 <no-reply@khu.ac.kr>'
                }
            })
        })
    ],
    providers: [MailService],
    controllers: [MailController],
    exports: [MailService]
})
export class MailModule {}