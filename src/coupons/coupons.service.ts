import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { DiscountType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { GetCouponsDto } from './dto/get-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
    constructor(private readonly prisma: PrismaService) { }

    async createCoupon(dto: CreateCouponDto) {
        const normalizedCode = dto.code.trim().toUpperCase();

        const existingCoupon = await this.prisma.coupon.findUnique({
            where: {
                code: normalizedCode,
            },
        });
        if (
            dto.discountType === DiscountType.PERCENTAGE &&
            dto.maximumDiscount == null
        ) {
            throw new BadRequestException(
                'maximumDiscount is required for percentage coupons',
            );
        }

        let maximumDiscount = dto.maximumDiscount;

        if (
            dto.discountType === DiscountType.PERCENTAGE &&
            maximumDiscount == null
        ) {
            throw new BadRequestException(
                'maximumDiscount is required for percentage coupons',
            );
        }

        if (dto.discountType === DiscountType.FIXED) {
            maximumDiscount = undefined;
        }
        if (existingCoupon) {
            throw new BadRequestException('Coupon code already exists');
        }

        if (new Date(dto.endDate) <= new Date(dto.startDate)) {
            throw new BadRequestException('End date must be after start date');
        }

        const coupon = await this.prisma.coupon.create({
            data: {
                code: normalizedCode,
                description: dto.description,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                minimumOrder: dto.minimumOrder,
                maximumDiscount: dto.maximumDiscount,
                usageLimit: dto.usageLimit,
                startDate: new Date(dto.startDate),
                endDate: new Date(dto.endDate),
                isActive: dto.isActive ?? true,
            },
        });

        return {
            message: 'Coupon created successfully',
            coupon,
        };
    }

    async getAllCoupons(dto: GetCouponsDto) {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: Prisma.CouponWhereInput = {};

        if (dto.search) {
            where.code = {
                contains: dto.search.trim().toUpperCase(),
                mode: 'insensitive',
            };
        }

        if (dto.isActive !== undefined) {
            where.isActive = dto.isActive === 'true';
        }

        const [coupons, total] = await this.prisma.$transaction([
            this.prisma.coupon.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            this.prisma.coupon.count({
                where,
            }),
        ]);

        return {
            message: 'Coupons fetched successfully',
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            coupons,
        };
    }

    async getCouponById(id: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        return {
            message: 'Coupon fetched successfully',
            coupon,
        };
    }

    async updateCoupon(id: string, dto: UpdateCouponDto) {
        const coupon = await this.prisma.coupon.findUnique({ where: { id } });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        let normalizedCode = coupon.code;

        if (dto.code) {
            normalizedCode = dto.code.trim().toUpperCase();

            const existing = await this.prisma.coupon.findFirst({
                where: {
                    code: normalizedCode,
                    NOT: {
                        id,
                    },
                },
            });

            if (existing) {
                throw new BadRequestException('Coupon code already exists');
            }
        }

        const startDate = dto.startDate ? new Date(dto.startDate) : coupon.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : coupon.endDate;

        if (endDate <= startDate) {
            throw new BadRequestException('End date must be after start date');
        }
        const discountType =
            dto.discountType ?? coupon.discountType;

        let maximumDiscount =
            dto.maximumDiscount ?? coupon.maximumDiscount;

        if (
            discountType === DiscountType.PERCENTAGE &&
            maximumDiscount == undefined
        ) {
            throw new BadRequestException(
                'maximumDiscount is required for percentage coupons',
            );
        }

        if (discountType === DiscountType.FIXED) {
            maximumDiscount == undefined ;
        }

        const updatedCoupon = await this.prisma.coupon.update({
            where: { id },
            data: {
                code: normalizedCode,
                description: dto.description ?? coupon.description,
                discountType: dto.discountType ?? coupon.discountType,
                discountValue: dto.discountValue ?? coupon.discountValue,
                minimumOrder: dto.minimumOrder ?? coupon.minimumOrder,
                maximumDiscount,
                usageLimit: dto.usageLimit ?? coupon.usageLimit,
                startDate,
                endDate,
                isActive: dto.isActive ?? coupon.isActive,
            },
        });

        return {
            message: 'Coupon updated successfully',
            coupon: updatedCoupon,
        };
    }

    async deleteCoupon(id: string) {
        const coupon = await this.prisma.coupon.findUnique({ where: { id } });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        if (coupon.usedCount > 0) {
            throw new BadRequestException('Coupon has already been used and cannot be deleted');
        }

        await this.prisma.coupon.delete({ where: { id } });

        return {
            message: 'Coupon deleted successfully',
        };
    }

    async getCouponByCode(code: string) {
        const normalizedCode = code.trim().toUpperCase();

        const coupon = await this.prisma.coupon.findUnique({
            where: {
                code: normalizedCode,
            },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        return {
            message: 'Coupon fetched successfully',
            coupon,
        };
    }
}
