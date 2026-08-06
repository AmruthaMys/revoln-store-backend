import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShippingStatusDto } from './dto/update-shipping-status.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createShipment(orderId: string, dto: CreateShipmentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot create shipment for cancelled order');
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot create shipment for delivered order');
    }

    const shipment = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.SHIPPED,
        trackingNumber: dto.trackingNumber,
        shippingCarrier: dto.carrier,
        estimatedDelivery: new Date(dto.estimatedDelivery),
        shippedAt: new Date(),
      } as Prisma.OrderUpdateInput,
    });

    setImmediate(async () => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: order.userId },
        });

        if (!user) {
          this.logger.warn(`User not found for shipment notification: ${order.userId}`);
          return;
        }

        await this.notificationsService.sendOrderStatusNotification({
          to: user.email,
          firstName: user.firstName,
          orderNumber: order.orderNumber,
          status: OrderStatus.SHIPPED,
        });

        this.logger.log(`Shipment created and notification sent for order ${order.orderNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send shipment notification for order ${order.orderNumber}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Shipment created successfully',
      shipment,
    };
  }

  async updateShippingStatus(orderId: string, dto: UpdateShippingStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.trackingNumber) {
      throw new BadRequestException('No shipment exists for this order');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
      } as Prisma.OrderUpdateInput,
    });

    return {
      message: 'Shipping status updated successfully',
      shipment: updatedOrder,
    };
  }

  async markDelivered(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.trackingNumber) {
      throw new BadRequestException('No shipment exists for this order');
    }

    const deliveredOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
      } as Prisma.OrderUpdateInput,
    });

    setImmediate(async () => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: order.userId },
        });

        if (!user) {
          this.logger.warn(`User not found for delivery notification: ${order.userId}`);
          return;
        }

        await this.notificationsService.sendOrderStatusNotification({
          to: user.email,
          firstName: user.firstName,
          orderNumber: order.orderNumber,
          status: OrderStatus.DELIVERED,
        });

        this.logger.log(`Delivery notification sent for order ${order.orderNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send delivery notification for order ${order.orderNumber}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Order marked as delivered',
      shipment: deliveredOrder,
    };
  }

  async updateTracking(orderId: string, dto: UpdateTrackingDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.trackingNumber) {
      throw new BadRequestException('No shipment exists for this order');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: dto.trackingNumber,
        shippingCarrier: dto.carrier,
      },
    });

    return {
      message: 'Shipment tracking updated successfully',
      shipment: updatedOrder,
    };
  }

  async getShipment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        trackingNumber: true,
        shippingCarrier: true,
        status: true,
        estimatedDelivery: true,
        shippedAt: true,
        deliveredAt: true,
      },
    });

    if (!order || !order.trackingNumber) {
      throw new NotFoundException('Shipment not found');
    }

    return {
      message: 'Shipment fetched successfully',
      shipment: order,
    };
  }

  async trackShipment(trackingNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        trackingNumber,
      },
      select: {
        trackingNumber: true,
        shippingCarrier: true,
        status: true,
        estimatedDelivery: true,
        shippedAt: true,
        deliveredAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Shipment not found');
    }

    return {
      message: 'Shipment status fetched successfully',
      shipment: order,
    };
  }
}
