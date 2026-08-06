import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    async getOrderById(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                address: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return {
            message: 'Order fetched successfully',
            order,
        };
    }

    async findMyOrders(userId: string) {
        const orders = await this.prisma.order.findMany({
            where: {
                userId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                address: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            message: 'Orders fetched successfully',
            count: orders.length,
            orders,
        };
    }

    async findOne(userId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            include: {
                address: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return {
            message: 'Order fetched successfully',
            order,
        };
    }

    async updateStatus(orderId: string, dto: UpdateOrderStatusDto) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Delivered orders cannot be updated');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cancelled orders cannot be updated');
        }

        const updatedOrder = await this.prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                status: dto.status,
            },
        });

        setImmediate(async () => {
            try {
                if (dto.status === OrderStatus.SHIPPED || dto.status === OrderStatus.DELIVERED) {
                    const orderWithUser = await this.prisma.order.findUnique({
                        where: { id: orderId },
                        include: {
                            user: {
                                select: {
                                    email: true,
                                    firstName: true,
                                },
                            },
                        },
                    });

                    if (!orderWithUser?.user) {
                        this.logger.warn(`User not found for status notification: ${orderId}`);
                        return;
                    }

                    await this.notificationsService.sendOrderStatusNotification({
                        to: orderWithUser.user.email,
                        firstName: orderWithUser.user.firstName,
                        orderNumber: updatedOrder.orderNumber,
                        status: dto.status,
                    });

                    const event = dto.status === OrderStatus.SHIPPED ? 'shipped' : 'delivered';
                    this.logger.log(`Order ${event} email sent for order ${updatedOrder.orderNumber}`);
                }
            } catch (error) {
                this.logger.error(
                    `Failed to send order status email for order ${updatedOrder.orderNumber}`,
                    error as Error,
                );
            }
        });

        return {
            message: 'Order status updated successfully',
            order: updatedOrder,
        };
    }

    async updatePaymentStatus(orderId: string, dto: UpdatePaymentStatusDto) {
        const order = await this.prisma.order.findUnique({
            where: {
                id: orderId,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Cannot update payment for a cancelled order');
        }

        if (
            order.paymentStatus === PaymentStatus.REFUNDED &&
            dto.paymentStatus !== PaymentStatus.REFUNDED
        ) {
            throw new BadRequestException('Refunded payment cannot be changed');
        }

        const updatedOrder = await this.prisma.order.update({
            where: {
                id: orderId,
            },
            data: {
                paymentStatus: dto.paymentStatus,
            },
        });

        return {
            message: 'Payment status updated successfully',
            order: updatedOrder,
        };
    }

    async getAllOrders(dto: GetOrdersDto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {};

        if (dto.status) {
            where.status = dto.status;
        }

        if (dto.paymentStatus) {
            where.paymentStatus = dto.paymentStatus;
        }

        if (dto.search) {
            where.orderNumber = {
                contains: dto.search,
                mode: 'insensitive',
            };
        }

        const [orders, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    address: true,
                    items: {
                        include: {
                            product: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.order.count({
                where,
            }),
        ]);

        return {
            message: 'Orders fetched successfully',
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            orders,
        };
    }

    async create(userId: string, dto: CreateOrderDto) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const address = await this.validateAddress(tx, userId, dto.addressId);
                const cartItems = await this.fetchCartItems(tx, userId);

                if (!cartItems.length) {
                    throw new BadRequestException('Cart is empty');
                }

                this.validateCartItems(cartItems);

                const subtotal = this.calculateSubtotal(cartItems);
                const coupon = await this.validateCoupon(tx, dto.couponCode, subtotal);
                const discount = this.calculateDiscount(subtotal, coupon);
                const shippingFee = 0;
                const total = subtotal - discount + shippingFee;

                const orderNumber = `ORD-${Date.now()}-${Math.floor(
                    Math.random() * 10000,
                )
                    .toString()
                    .padStart(4, '0')}`;

                const order = await tx.order.create({
                    data: {
                        userId,
                        addressId: dto.addressId,
                        orderNumber,
                        subtotal,
                        discount,
                        shippingFee,
                        total,
                        couponId: coupon?.id,
                        status: OrderStatus.PENDING,
                        paymentStatus: PaymentStatus.PENDING,
                    },
                });

                await this.createOrderItems(tx, order.id, cartItems);
                await this.decrementStock(tx, cartItems);

                if (coupon) {
                    await this.incrementCouponUsage(tx, coupon.id);
                }

                await tx.cartItem.deleteMany({
                    where: { userId },
                });

                const completeOrder = await this.fetchCompleteOrder(tx, order.id);

                const response = {
                    message: 'Order placed successfully',
                    order: completeOrder,
                };

                setImmediate(async () => {
                    try {
                        const user = await this.prisma.user.findUnique({
                            where: { id: userId },
                        });

                        if (!user) {
                            this.logger.warn(`User not found for order notification: ${userId}`);
                            return;
                        }

                        const orderItems = completeOrder?.items.map((item) => ({
                            name: item.product.name,
                            quantity: item.quantity,
                            price: item.unitPrice.toString(),
                        })) ?? [];

                        await this.notificationsService.sendOrderStatusNotification({
                            to: user.email,
                            firstName: user.firstName,
                            orderNumber: completeOrder?.orderNumber ?? orderNumber,
                            status: OrderStatus.PENDING,
                            total: Number(completeOrder?.total ?? total),
                            items: orderItems,
                        });

                        this.logger.log(`Order confirmation email sent for order ${orderNumber}`);
                    } catch (error) {
                        this.logger.error(
                            `Failed to send order confirmation email for order ${orderNumber}`,
                            error as Error,
                        );
                    }
                });

                return response;
            });
        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }

            throw new InternalServerErrorException('Failed to create order');
        }
    }

    private async validateAddress(
        tx: Prisma.TransactionClient,
        userId: string,
        addressId: string,
    ) {
        const address = await tx.address.findFirst({
            where: {
                id: addressId,
                userId,
            },
        });

        if (!address) {
            throw new NotFoundException('Address not found');
        }

        return address;
    }

    private async fetchCartItems(
        tx: Prisma.TransactionClient,
        userId: string,
    ) {
        return tx.cartItem.findMany({
            where: { userId },
            include: { product: true },
        });
    }

    private validateCartItems(
        cartItems: Array<Prisma.CartItemGetPayload<{ include: { product: true } }>>,
    ) {
        for (const cartItem of cartItems) {
            if (!cartItem.product.isActive) {
                throw new BadRequestException(
                    `${cartItem.product.name} is unavailable`,
                );
            }

            if (cartItem.product.stock < cartItem.quantity) {
                throw new BadRequestException(
                    `${cartItem.product.name} is out of stock`,
                );
            }
        }
    }

    private calculateSubtotal(
        cartItems: Array<Prisma.CartItemGetPayload<{ include: { product: true } }>>,
    ) {
        return cartItems.reduce(
            (subtotal, cartItem) =>
                subtotal + Number(cartItem.product.price) * cartItem.quantity,
            0,
        );
    }

    private async validateCoupon(
        tx: Prisma.TransactionClient,
        couponCode: string | undefined,
        subtotal: number,
    ) {
        if (!couponCode) {
            return null;
        }

        const coupon = await tx.coupon.findUnique({
            where: {
                code: couponCode.trim().toUpperCase(),
            },
        });

        if (!coupon) {
            throw new BadRequestException('Invalid coupon');
        }

        if (!coupon.isActive) {
            throw new BadRequestException('Coupon is inactive');
        }

        const now = new Date();

        if (now < coupon.startDate) {
            throw new BadRequestException('Coupon is not active yet');
        }

        if (now > coupon.endDate) {
            throw new BadRequestException('Coupon has expired');
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new BadRequestException('Coupon usage limit reached');
        }

        if (coupon.minimumOrder && subtotal < Number(coupon.minimumOrder)) {
            throw new BadRequestException(
                `Minimum order amount is ${coupon.minimumOrder}`,
            );
        }

        return coupon;
    }

    private calculateDiscount(
        subtotal: number,
        coupon: Prisma.CouponGetPayload<{}> | null,
    ) {
        if (!coupon) {
            return 0;
        }

        let discount = 0;

        if (coupon.discountType === 'PERCENTAGE') {
            discount = (subtotal * Number(coupon.discountValue)) / 100;

            if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
                discount = Number(coupon.maximumDiscount);
            }
        } else {
            discount = Number(coupon.discountValue);
        }

        return discount > subtotal ? subtotal : discount;
    }

    private async createOrderItems(
        tx: Prisma.TransactionClient,
        orderId: string,
        cartItems: Array<Prisma.CartItemGetPayload<{ include: { product: true } }>>,
    ) {
        for (const cartItem of cartItems) {
            await tx.orderItem.create({
                data: {
                    orderId,
                    productId: cartItem.productId,
                    quantity: cartItem.quantity,
                    unitPrice: cartItem.product.price,
                    totalPrice: Number(cartItem.product.price) * cartItem.quantity,
                },
            });
        }
    }

    private async decrementStock(
        tx: Prisma.TransactionClient,
        cartItems: Array<Prisma.CartItemGetPayload<{ include: { product: true } }>>,
    ) {
        for (const cartItem of cartItems) {
            await tx.product.update({
                where: { id: cartItem.productId },
                data: {
                    stock: {
                        decrement: cartItem.quantity,
                    },
                },
            });
        }
    }

    private async incrementCouponUsage(
        tx: Prisma.TransactionClient,
        couponId: string,
    ) {
        await tx.coupon.update({
            where: { id: couponId },
            data: {
                usedCount: {
                    increment: 1,
                },
            },
        });
    }

    private async fetchCompleteOrder(
        tx: Prisma.TransactionClient,
        orderId: string,
    ) {
        return tx.order.findUnique({
            where: { id: orderId },
            include: {
                address: true,
                coupon: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
    }

    async cancelOrder(
        userId: string,
        orderId: string,
        dto: CancelOrderDto,
    ) {
        const order = await this.findOrderForUserCancellation(userId, orderId);

        this.validateOrderCancelable(order);

        const updatedOrder = await this.prisma.$transaction(async (tx) =>
            this.processOrderCancellation(tx, order, userId),
        );

        setImmediate(async () => {
            try {
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                });

                if (!user) {
                    this.logger.warn(`User not found for cancellation notification: ${userId}`);
                    return;
                }

                await this.notificationsService.sendOrderStatusNotification({
                    to: user.email,
                    firstName: user.firstName,
                    orderNumber: updatedOrder.orderNumber,
                    status: OrderStatus.CANCELLED,
                    reason: dto.reason,
                });

                this.logger.log(`Order cancelled email sent for order ${updatedOrder.orderNumber}`);
            } catch (error) {
                this.logger.error(
                    `Failed to send order cancelled email for order ${updatedOrder.orderNumber}`,
                    error as Error,
                );
            }
        });

        return {
            message: 'Order cancelled successfully',
            order: updatedOrder,
        };
    }

    async cancelOrderByAdmin(
        orderId: string,
        dto: CancelOrderDto,
    ) {
        const order = await this.findOrderForAdminCancellation(orderId);

        this.validateOrderCancelable(order);

        const updatedOrder = await this.prisma.$transaction(async (tx) =>
            this.processOrderCancellation(tx, order, order.userId),
        );

        return {
            message: 'Order cancelled successfully',
            order: updatedOrder,
        };
    }

    private async findOrderForUserCancellation(
        userId: string,
        orderId: string,
    ) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
            include: {
                items: true,
                coupon: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    private async findOrderForAdminCancellation(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                coupon: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    private validateOrderCancelable(order: { status: OrderStatus }) {
        if (
            order.status !== OrderStatus.PENDING &&
            order.status !== OrderStatus.CONFIRMED
        ) {
            throw new BadRequestException(
                `Order cannot be cancelled because it is ${order.status}`,
            );
        }
    }

    private async processOrderCancellation(
        tx: Prisma.TransactionClient,
        order: any,
        createdBy: string,
    ) {
        await this.restoreInventory(tx, order.items, createdBy);
        await this.rollbackCouponUsage(tx, order.couponId);

        return tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
            include: {
                items: true,
                coupon: true,
            },
        });
    }

    private async restoreInventory(
        tx: Prisma.TransactionClient,
        orderItems: Array<{ productId: string; quantity: number }>,
        createdBy: string,
    ) {
        for (const item of orderItems) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                },
            });

            const product = await tx.product.findUnique({
                where: { id: item.productId },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            await tx.inventoryLog.create({
                data: {
                    productId: item.productId,
                    type: 'RETURN',
                    quantity: item.quantity,
                    previousQty: product.stock - item.quantity,
                    currentQty: product.stock,
                    note: 'Stock restored after order cancellation',
                    createdBy,
                },
            });
        }
    }

    private async rollbackCouponUsage(
        tx: Prisma.TransactionClient,
        couponId?: string,
    ) {
        if (!couponId) {
            return;
        }

        await tx.coupon.update({
            where: { id: couponId },
            data: {
                usedCount: {
                    decrement: 1,
                },
            },
        });
    }
}
