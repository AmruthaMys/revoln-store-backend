import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import Razorpay from 'razorpay';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpay: Razorpay | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      this.logger.warn('Razorpay disabled. Credentials not configured.');
      this.razorpay = null;
      return;
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(
    userId: string,
    dto: CreatePaymentDto,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        userId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Cancelled orders cannot be paid',
      );
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Order is already paid',
      );
    }

    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        'Payment gateway is currently unavailable.',
      );
    }

    const razorpayOrder =
      await this.razorpay.orders.create({
        amount: Math.round(Number(order.total) * 100),
        currency: 'INR',
        receipt: order.orderNumber,
      });

    await this.prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentOrderId: razorpayOrder.id,
      },
    });

    return {
      message: 'Payment order created successfully',

      key: this.configService.get('RAZORPAY_KEY_ID'),

      orderId: order.id,

      razorpayOrderId: razorpayOrder.id,

      amount: razorpayOrder.amount,

      currency: razorpayOrder.currency,
    };
  }

  async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto,
  ) {
    if (!this.razorpay) {
      throw new ServiceUnavailableException(
        'Payment gateway is currently unavailable.',
      );
    }

    return {
      message: 'Payment verification will be implemented in Part 12.3',
    };
  }
}
