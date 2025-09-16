import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService
    ) {}

    public sendEmail(mail: string, context: any): void {
        const { subject, text } = context;
        this.mailerService
            .sendMail({
                to: mail,
                from: this.configService.get<string>('MAIL_SENDER'),
                subject: subject || '[KHU마일리지] Welcome to Our service!',
                text: text || '[KHU마일리지] Congratulations on signing up for Our service!',
                html: '<b>welcome</b>' // HTML body content
            })
            .then((result) => {
                console.log(result);
            })
            .catch((error) => {
                console.log(error);
            });
    }
}