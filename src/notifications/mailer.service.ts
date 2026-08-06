import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly isConfigured: boolean;

  constructor(
    private readonly mailerService: NestMailerService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('MAIL_HOST');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASSWORD');
    const from = this.configService.get<string>('MAIL_FROM');

    this.isConfigured = Boolean(host && user && pass && from);

    if (!this.isConfigured) {
      this.logger.warn(
        'Email service is not configured. SMTP mail delivery is disabled.',
      );
    }
  }

  async sendMail(options: {
    to: string;
    subject: string;
    template: string;
    context?: Record<string, unknown>;
  }) {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'Email service is currently unavailable.',
      );
    }

    try {
      return await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
      });
    } catch (error) {
      this.logger.error('Email delivery failed', error as Error);
      throw new Error('Failed to send email.');
    }
  }
}
