import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentStatus,
  RoleType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenueResult,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      lowStockProducts,
      activeCoupons,
    ] = await this.prisma.$transaction([
      this.prisma.user.count({
        where: { role: { name: RoleType.CUSTOMER } },
      }),
      this.prisma.product.count({
        where: { isActive: true },
      }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.PROCESSING },
      }),
      this.prisma.order.count({
        where: { status: OrderStatus.DELIVERED },
      }),
      this.prisma.product.count({
        where: {
          stock: { lte: 10 },
          isActive: true,
        },
      }),
      this.prisma.coupon.count({
        where: {
          isActive: true,
          endDate: { gte: new Date() },
        },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: Number(totalRevenueResult._sum.total ?? 0),
      pendingOrders,
      processingOrders,
      deliveredOrders,
      lowStockProducts,
      activeCoupons,
    };
  }
}
