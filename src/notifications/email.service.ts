import { Injectable, Logger } from '@nestjs/common';

import { MailerService } from './mailer.service';
import { OrderItemDto } from './dto/order-item.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendTemplateEmail(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown> | object,
  ) {
    this.logger.log(`Sending email to ${to} with template ${template}`);

    return this.mailerService.sendMail({
      to,
      subject,
      template,
      context: context as Record<string, unknown> | undefined,
    });
  }

  async sendWelcomeEmail(to: string, firstName: string) {
    return this.sendTemplateEmail(to, 'Welcome to REVOLN', 'welcome', {
      firstName,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetUrl: string,
  ) {
    return this.sendTemplateEmail(to, 'Reset your REVOLN password', 'password-reset', {
      firstName,
      resetUrl,
    });
  }

  async sendOrderConfirmationEmail(
    to: string,
    firstName: string,
    orderNumber: string,
    total: string | number | undefined,
    items: OrderItemDto[],
  ) {
    return this.sendTemplateEmail(to, 'Order confirmed — REVOLN', 'order-confirmation', {
      firstName,
      orderNumber,
      total,
      items,
    });
  }

  async sendOrderCancelledEmail(
    to: string,
    firstName: string,
    orderNumber: string,
    reason?: string,
  ) {
    return this.sendTemplateEmail(to, 'Order cancelled — REVOLN', 'order-cancelled', {
      firstName,
      orderNumber,
      reason: reason ?? 'No additional details available',
    });
  }

  async sendOrderShippedEmail(
    to: string,
    firstName: string,
    orderNumber: string,
    status: string,
  ) {
    return this.sendTemplateEmail(to, 'Order shipped — REVOLN', 'shipped', {
      firstName,
      orderNumber,
      status,
    });
  }

  async sendOrderDeliveredEmail(
    to: string,
    firstName: string,
    orderNumber: string,
    status: string,
  ) {
    return this.sendTemplateEmail(to, 'Order delivered — REVOLN', 'delivered', {
      firstName,
      orderNumber,
      status,
    });
  }
}
