import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MILEAGE_STATUS } from './constants/mileage-status.enum';
import { getMileageEmailTemplate } from './templates/mileage-email.template';

@Injectable()
export class MailService {
    constructor(
        private readonly mailerService: MailerService,
        private configService: ConfigService
    ) {}

    public sendEmail(mail: string, context: any): void {
        const { content, type }: { content: any; type: MILEAGE_STATUS } = context;
        const subjectMap = {
    [MILEAGE_STATUS.REVIEWING]: '[KHU마일리지] 신청 접수 안내',
    [MILEAGE_STATUS.APPROVED]: '[KHU마일리지] 승인 완료 안내',
    [MILEAGE_STATUS.REJECTED]: '[KHU마일리지] 반려 안내'
  };

  const html = getMileageEmailTemplate(type, content);

  this.mailerService
    .sendMail({
      to: mail,
      from: this.configService.get<string>('MAIL_SENDER'),
      subject: subjectMap[type] || '[KHU마일리지] 알림',
      text: '경희대학교 마일리지 알림 메일입니다',
      html: html,
    })
    .then((result) => {
      console.log('Mail sent:', result);
    })
    .catch((error) => {
      console.error('Mail error:', error);
    });
    }
}