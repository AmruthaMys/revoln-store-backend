import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, RefundStatus, ReturnStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';

@Injectable()
export class ReturnsService {
  private readonly logger = new Logger(ReturnsService.name);
  private readonly returnWindowDays = Number(process.env.RETURN_WINDOW_DAYS ?? '7');

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createReturnRequest(userId: string, dto: CreateReturnRequestDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You do not own this order');
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned');
    }

    const deliveredAt = order.deliveredAt;

    if (!deliveredAt) {
      throw new BadRequestException('Delivered order does not have a delivered date');
    }

    const allowedDate = new Date(deliveredAt);
    allowedDate.setDate(allowedDate.getDate() + this.returnWindowDays);

    if (new Date() > allowedDate) {
      throw new BadRequestException('Return window has expired');
    }

    const existingReturn = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: {
          in: [ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.RECEIVED],
        },
      },
    });

    if (existingReturn) {
      throw new BadRequestException('A return request already exists for this order');
    }

    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId,
        reason: dto.reason,
        status: ReturnStatus.PENDING,
        refundStatus: RefundStatus.PENDING,
      },
    });

    setImmediate(async () => {
      try {
        await this.notificationsService.sendReturnRequestNotification({
          to: order.user.email,
          firstName: order.user.firstName,
          orderNumber: order.orderNumber,
          returnId: returnRequest.id,
        });
        this.logger.log(`Return request email sent for order ${order.orderNumber}`);
      } catch (error) {
        this.logger.error(
          `Failed to send return request email for order ${order.orderNumber}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Return request created successfully',
      returnRequest,
    };
  }

  async findMyReturns(userId: string) {
    const returns = await this.prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
      },
    });

    return {
      message: 'Return requests fetched successfully',
      returns,
    };
  }

  async findReturnRequest(userId: string, id: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (returnRequest.userId !== userId) {
      throw new BadRequestException('You do not own this return request');
    }

    return {
      message: 'Return request fetched successfully',
      returnRequest,
    };
  }

  async cancelReturnRequest(userId: string, id: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    if (returnRequest.userId !== userId) {
      throw new BadRequestException('You do not own this return request');
    }

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending return requests can be cancelled');
    }

    const canceled = await this.prisma.returnRequest.update({
      where: { id },
      data: { status: ReturnStatus.CANCELLED },
    });

    return {
      message: 'Return request cancelled successfully',
      returnRequest: canceled,
    };
  }

  async findAllReturnRequests() {
    const returns = await this.prisma.returnRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      message: 'Return requests fetched successfully',
      returns,
    };
  }

  async approveReturnRequest(id: string) {
    const returnRequest = await this.ensureReturnRequestExists(id);

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    const approved = await this.prisma.returnRequest.update({
      where: { id },
      data: { status: ReturnStatus.APPROVED },
    });

    setImmediate(async () => {
      try {
        await this.notificationsService.sendReturnApprovedNotification({
          to: returnRequest.user.email,
          firstName: returnRequest.user.firstName,
          orderNumber: returnRequest.order.orderNumber,
          returnId: returnRequest.id,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send return approved email for request ${returnRequest.id}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Return request approved successfully',
      returnRequest: approved,
    };
  }

  async rejectReturnRequest(id: string) {
    const returnRequest = await this.ensureReturnRequestExists(id);

    if (returnRequest.status !== ReturnStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const rejected = await this.prisma.returnRequest.update({
      where: { id },
      data: { status: ReturnStatus.REJECTED },
    });

    setImmediate(async () => {
      try {
        await this.notificationsService.sendReturnRejectedNotification({
          to: returnRequest.user.email,
          firstName: returnRequest.user.firstName,
          orderNumber: returnRequest.order.orderNumber,
          returnId: returnRequest.id,
          reason: returnRequest.reason ?? 'No reason provided',
        });
      } catch (error) {
        this.logger.error(
          `Failed to send return rejected email for request ${returnRequest.id}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Return request rejected successfully',
      returnRequest: rejected,
    };
  }

  async markReturnReceived(id: string) {
    const returnRequest = await this.ensureReturnRequestExists(id);

    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be marked as received');
    }

    const received = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: ReturnStatus.RECEIVED },
      });

      const orderItems = await tx.orderItem.findMany({
        where: { orderId: updated.orderId },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return updated;
    });

    setImmediate(async () => {
      try {
        await this.notificationsService.sendReturnReceivedNotification({
          to: returnRequest.user.email,
          firstName: returnRequest.user.firstName,
          orderNumber: returnRequest.order.orderNumber,
          returnId: returnRequest.id,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send return received email for request ${returnRequest.id}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Return request marked as received successfully',
      returnRequest: received,
    };
  }

  async refundReturnRequest(id: string) {
    const returnRequest = await this.ensureReturnRequestExists(id);

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      throw new BadRequestException('Refund can only be processed after the return is received');
    }

    const refunded = await this.prisma.returnRequest.update({
      where: { id },
      data: { refundStatus: RefundStatus.COMPLETED },
    });

    // TODO: Integrate Razorpay refund processing here.

    setImmediate(async () => {
      try {
        await this.notificationsService.sendRefundCompletedNotification({
          to: returnRequest.user.email,
          firstName: returnRequest.user.firstName,
          orderNumber: returnRequest.order.orderNumber,
          returnId: returnRequest.id,
          refundStatus: refunded.refundStatus,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send refund completed email for request ${returnRequest.id}`,
          error as Error,
        );
      }
    });

    return {
      message: 'Refund completed successfully',
      returnRequest: refunded,
    };
  }

  private async ensureReturnRequestExists(id: string) {
    const returnRequest = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        user: true,
      },
    });

    if (!returnRequest) {
      throw new NotFoundException('Return request not found');
    }

    return returnRequest;
  }
}
