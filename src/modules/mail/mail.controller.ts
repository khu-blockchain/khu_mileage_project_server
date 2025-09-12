import { Controller, Get, Query } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('test')
  async sendTest(@Query('to') to: string) {
    return this.mailService.sendEmail(to, {
      subject: 'Test Email from KHU Mileage',
      text: 'This is a test email sent from the KHU Mileage system.',
    });
  }
}