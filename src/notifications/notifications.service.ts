import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { EmailService } from './email.service';
import { OrderStatusNotificationDto } from './dto/order-status-notification.dto';
import { ReturnNotificationDto } from './dto/return-notification.dto';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly emailService: EmailService) {}

  async sendCustomEmail(dto: SendEmailDto) {
    this.logger.log(`Sending custom email to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      dto.subject,
      dto.template,
      dto.context,
    );
  }

  async sendWelcomeNotification(to: string, firstName: string) {
    this.logger.log(`Sending welcome notification to ${to}`);

    return this.emailService.sendWelcomeEmail(to, firstName);
  }

  async sendPasswordResetNotification(
    to: string,
    firstName: string,
    resetUrl: string,
  ) {
    this.logger.log(`Sending password reset notification to ${to}`);

    return this.emailService.sendPasswordResetEmail(to, firstName, resetUrl);
  }

  async sendOrderStatusNotification(dto: OrderStatusNotificationDto) {
    this.logger.log(
      `Sending order status notification to ${dto.to} for order ${dto.orderNumber}`,
    );

    if (dto.status === OrderStatus.SHIPPED) {
      return this.emailService.sendOrderShippedEmail(
        dto.to,
        dto.firstName,
        dto.orderNumber,
        dto.status,
      );
    }

    if (dto.status === OrderStatus.DELIVERED) {
      return this.emailService.sendOrderDeliveredEmail(
        dto.to,
        dto.firstName,
        dto.orderNumber,
        dto.status,
      );
    }

    if (dto.status === OrderStatus.CANCELLED) {
      return this.emailService.sendOrderCancelledEmail(
        dto.to,
        dto.firstName,
        dto.orderNumber,
        dto.reason,
      );
    }

    return this.emailService.sendOrderConfirmationEmail(
      dto.to,
      dto.firstName,
      dto.orderNumber,
      dto.total,
      dto.items ?? [],
    );
  }

  async sendReturnRequestNotification(dto: ReturnNotificationDto) {
    this.logger.log(`Sending return request notification to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      'Return request created — REVOLN',
      'return-requested',
      dto,
    );
  }

  async sendReturnApprovedNotification(dto: ReturnNotificationDto) {
    this.logger.log(`Sending return approved notification to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      'Return approved — REVOLN',
      'return-approved',
      dto,
    );
  }

  async sendReturnRejectedNotification(dto: ReturnNotificationDto) {
    this.logger.log(`Sending return rejected notification to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      'Return rejected — REVOLN',
      'return-rejected',
      dto,
    );
  }

  async sendReturnReceivedNotification(dto: ReturnNotificationDto) {
    this.logger.log(`Sending return received notification to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      'Return received — REVOLN',
      'return-received',
      dto,
    );
  }

  async sendRefundCompletedNotification(dto: ReturnNotificationDto) {
    this.logger.log(`Sending refund completed notification to ${dto.to}`);

    return this.emailService.sendTemplateEmail(
      dto.to,
      'Refund completed — REVOLN',
      'refund-completed',
      dto,
    );
  }
}
