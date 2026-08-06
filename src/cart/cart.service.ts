import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { DiscountType } from '@prisma/client';

@Injectable()
export class CartService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async addToCart(
        userId: string,
        addToCartDto: AddToCartDto,
    ) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: addToCartDto.productId,
            },
        });

        if (!product) {
            throw new NotFoundException(
                'Product not found',
            );
        }

        if (!product.isActive) {
            throw new BadRequestException(
                'Product is inactive',
            );
        }

        if (product.stock < addToCartDto.quantity) {
            throw new BadRequestException(
                'Insufficient stock',
            );
        }

        const existingCartItem =
            await this.prisma.cartItem.findUnique({
                where: {
                    userId_productId: {
                        userId,
                        productId: addToCartDto.productId,
                    },
                },
            });

        if (existingCartItem) {
            return this.prisma.cartItem.update({
                where: {
                    id: existingCartItem.id,
                },
                data: {
                    quantity:
                        existingCartItem.quantity +
                        addToCartDto.quantity,
                },
                include: {
                    product: true,
                },
            });
        }

        return this.prisma.cartItem.create({
            data: {
                quantity: addToCartDto.quantity,
                user: {
                    connect: {
                        id: userId,
                    },
                },
                product: {
                    connect: {
                        id: addToCartDto.productId,
                    },
                },
            },
            include: {
                product: true,
            },
        });
    }

    async getMyCart(userId: string) {

        const cartItems = await this.prisma.cartItem.findMany({
            where: {
                userId,
            },
            include: {
                product: {
                    include: {
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const inactive = cartItems.find(
            item => !item.product.isActive,
        );

        if (inactive) {
            throw new BadRequestException(
                `${inactive.product.name} is no longer available`,
            );
        }
        let subtotal = 0;
        let totalItems = 0;

        const outOfStock = cartItems.find(
            item => item.quantity > item.product.stock,
        );

        if (outOfStock) {
            throw new BadRequestException(
                `${outOfStock.product.name} has insufficient stock`,
            );
        }

        const items = cartItems.map((item) => {
            const price = Number(item.product.price);
            const itemTotal = price * item.quantity;

            subtotal += itemTotal;
            totalItems += item.quantity;

            return {
                id: item.id,
                quantity: item.quantity,
                itemTotal,
                product: item.product,
            };
        });

        return {
            items,
            summary: {
                totalItems,
                subtotal,
            },
        };
    }

    async updateCartItem(
        userId: string,
        cartItemId: string,
        updateCartDto: UpdateCartDto,
    ) {
        const cartItem = await this.prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                userId,
            },
            include: {
                product: true,
            },
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        if (updateCartDto.quantity > cartItem.product.stock) {
            throw new BadRequestException('Insufficient stock');
        }

        return this.prisma.cartItem.update({
            where: {
                id: cartItemId,
            },
            data: {
                quantity: updateCartDto.quantity,
            },
            include: {
                product: true,
            },
        });
    }

    async removeCartItem(userId: string, cartItemId: string) {
        const cartItem = await this.prisma.cartItem.findFirst({
            where: {
                id: cartItemId,
                userId,
            },
        });

        if (!cartItem) {
            throw new NotFoundException('Cart item not found');
        }

        await this.prisma.cartItem.delete({
            where: {
                id: cartItemId,
            },
        });

        return {
            message: 'Cart item removed successfully',
        };
    }

    async clearCart(userId: string) {
        await this.prisma.cartItem.deleteMany({
            where: {
                userId,
            },
        });

        return {
            message: 'Cart cleared successfully',
        };
    }

    async applyCoupon(userId: string, dto: ApplyCouponDto) {
        const cart = await this.getMyCart(userId);

        if (cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const normalizedCode = dto.code.trim().toUpperCase();

        const coupon = await this.prisma.coupon.findUnique({
            where: { code: normalizedCode },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        if (!coupon.isActive) {
            throw new BadRequestException('Coupon is not active');
        }

        const now = new Date();
        if (now < coupon.startDate) {
            throw new BadRequestException('Coupon is not yet valid');
        }

        if (now > coupon.endDate) {
            throw new BadRequestException('Coupon has expired');
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new BadRequestException('Coupon usage limit reached');
        }

        if (coupon.minimumOrder && cart.summary.subtotal < Number(coupon.minimumOrder)) {
            throw new BadRequestException(
                `Minimum order amount of ${coupon.minimumOrder} is required`,
            );
        }

        let discount = 0;

        if (coupon.discountType === DiscountType.PERCENTAGE) {
            discount = Number(
                (
                    (cart.summary.subtotal *
                        Number(coupon.discountValue)) /
                    100
                ).toFixed(2),
            ); if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
                discount = Number(coupon.maximumDiscount);
            }
        } else {
            // FIXED discount
            discount = Number(coupon.discountValue);
        }

        // Ensure discount does not exceed subtotal
        if (discount > cart.summary.subtotal) {
            discount = cart.summary.subtotal;
        }

        const total = cart.summary.subtotal - discount;

        return {
            message: 'Coupon applied successfully',

            coupon: {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue.toString(),
            },

            items: cart.items,

            summary: {
                totalItems: cart.summary.totalItems,
                subtotal: cart.summary.subtotal.toFixed(2),
                discount: discount.toFixed(2),
                shippingFee: '0.00',
                total: total.toFixed(2),
            },
        };
    }
}