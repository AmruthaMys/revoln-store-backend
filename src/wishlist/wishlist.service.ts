import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addToWishlist(
    userId: string,
    dto: CreateWishlistDto,
  ) {
    // -----------------------------
    // Validate Product
    // -----------------------------
    const product = await this.prisma.product.findUnique({
      where: {
        id: dto.productId,
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

    // -----------------------------
    // Prevent Duplicate
    // -----------------------------
    const existing =
      await this.prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: dto.productId,
          },
        },
      });

    if (existing) {
      throw new BadRequestException(
        'Product already exists in wishlist',
      );
    }

    // -----------------------------
    // Create Wishlist Item
    // -----------------------------
    const wishlist =
      await this.prisma.wishlist.create({
        data: {
          user: {
            connect: {
              id: userId,
            },
          },
          product: {
            connect: {
              id: dto.productId,
            },
          },
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
      });

    return {
      message:
        'Product added to wishlist successfully',
      wishlist,
    };
  }

  async getMyWishlist(userId: string) {
    const wishlist =
      await this.prisma.wishlist.findMany({
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

    return {
      message:
        'Wishlist fetched successfully',
      count: wishlist.length,
      wishlist,
    };
  }

  async removeFromWishlist(
    userId: string,
    productId: string,
  ) {
    const wishlist =
      await this.prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Product not found in wishlist',
      );
    }

    await this.prisma.wishlist.delete({
      where: {
        id: wishlist.id,
      },
    });

    return {
      message:
        'Product removed from wishlist successfully',
    };
  }
}