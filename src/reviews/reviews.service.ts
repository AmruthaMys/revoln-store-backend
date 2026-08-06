import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: OrderStatus.DELIVERED,
        },
      },
    });

    if (!purchased) {
      throw new BadRequestException('You can review only delivered products');
    }

    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.updateProductRating(productId);

    return {
      message: 'Review added successfully',
      review: {
        id: review.id,
      },
    };
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        averageRating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where: {
          productId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          productId,
        },
      }),
    ]);

    return {
      message: 'Reviews fetched successfully',
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      product,
      reviews,
    };
  }

  async updateReview(userId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        userId,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: dto.rating ?? review.rating,
        comment: dto.comment ?? review.comment,
      },
    });

    await this.updateProductRating(review.productId);

    return {
      message: 'Review updated successfully',
      review: updatedReview,
    };
  }

  async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new BadRequestException('You can only delete your own review');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    await this.updateProductRating(review.productId);

    return {
      message: 'Review deleted successfully',
    };
  }

  async getAllReviews() {
    const reviews = await this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Reviews fetched successfully',
      count: reviews.length,
      reviews,
    };
  }

  private async updateProductRating(productId: string) {
    const stats = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating ?? 0,
        reviewCount: stats._count,
      },
    });
  }
}
