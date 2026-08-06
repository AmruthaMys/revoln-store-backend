import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';
import { SearchProductsDto } from './dto/search-products.dto';
import { LowStockDto } from './dto/low-stock.dto';
import { StockOperation, UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async create(
    createProductDto: CreateProductDto,
  ) {
    const existingProduct =
      await this.prisma.product.findUnique({
        where: {
          sku: createProductDto.sku,
        },
      });

    if (existingProduct) {
      throw new ConflictException(
        'SKU already exists',
      );
    }

    const category =
      await this.prisma.category.findUnique({
        where: {
          id: createProductDto.categoryId,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    const {
      categoryId,
      ...productData
    } = createProductDto;

    const product =
      await this.prisma.product.create({
        data: {
          ...productData,
          category: {
            connect: {
              id: categoryId,
            },
          },
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return {
      message: 'Product created successfully',
      product,
    };
  }

  async findAll(dto: SearchProductsDto) {
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 12);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    // Active filter
    if (dto.isActive !== undefined) {
      where.isActive = dto.isActive === 'true';
    } else {
      where.isActive = true;
    }

    // Search by name or SKU
    if (dto.search) {
      where.OR = [
        {
          name: {
            contains: dto.search,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: dto.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Category filter
    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }

    // Price filters
    if (dto.minPrice || dto.maxPrice) {
      where.price = {};

      if (dto.minPrice) {
        where.price.gte = new Prisma.Decimal(dto.minPrice);
      }

      if (dto.maxPrice) {
        where.price.lte = new Prisma.Decimal(dto.maxPrice);
      }
    }

    // Minimum rating
    if (dto.minRating) {
      where.averageRating = {
        gte: Number(dto.minRating),
      };
    }

    // Stock filter
    if (dto.inStock === 'true') {
      where.stock = {
        gt: 0,
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [dto.sortBy ?? 'createdAt']: dto.sortOrder ?? 'desc',
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

    return {
      message: 'Products fetched successfully',
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products,
    };
  }

  async getFeaturedProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: {
          gt: 0,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          averageRating: 'desc',
        },
        {
          reviewCount: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 8,
    });

    return {
      message: 'Featured products fetched successfully',
      count: products.length,
      products,
    };
  }
  async getNewArrivals() {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 8,
    });

    return {
      message: 'New arrivals fetched successfully',
      count: products.length,
      products,
    };
  }
  async getBestSellers() {
    const sales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 8,
    });

    if (sales.length === 0) {
      return {
        message: 'Best sellers fetched successfully',
        count: 0,
        products: [],
      };
    }

    const productIds = sales.map((item) => item.productId);

    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const rankedProducts = sales
      .map((sale) => {
        const product = products.find(
          (p) => p.id === sale.productId,
        );

        if (!product) {
          return null;
        }

        return {
          ...product,
          sold: sale._sum.quantity ?? 0,
        };
      })
      .filter(Boolean);

    return {
      message: 'Best sellers fetched successfully',
      count: rankedProducts.length,
      products: rankedProducts,
    };
  }
  async getRelatedProducts(id: string) {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        NOT: {
          id,
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        averageRating: 'desc',
      },
      take: 8,
    });

    return {
      message: 'Related products fetched successfully',
      count: products.length,
      products,
    };
  }

  async getLowStockProducts(dto: LowStockDto) {
    const threshold = Number(dto.threshold ?? 10);
    const page = Number(dto.page ?? 1);
    const limit = Number(dto.limit ?? 10);

    const skip = (page - 1) * limit;

    const where = {
      isActive: true,
      stock: {
        lte: threshold,
      },
    };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          stock: 'asc',
        },
        skip,
        take: limit,
      }),

      this.prisma.product.count({
        where,
      }),
    ]);

    return {
      message: 'Low stock products fetched successfully',
      threshold,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      products,
    };
  }

  async getInventoryHistory(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const history = await this.prisma.inventoryLog.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Inventory history fetched successfully',
      count: history.length,
      history,
    };
  }

  async updateStock(
    productId: string,
    adminId: string,
    dto: UpdateStockDto,
) {
  const product = await this.prisma.product.findUnique({
    where: {
      id:productId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    throw new NotFoundException(
      'Product not found',
    );
  }

  let newStock = product.stock;

  if (dto.operation === StockOperation.INCREASE) {
    newStock += dto.quantity;
  } else {
    if (product.stock < dto.quantity) {
      throw new ConflictException(
        'Insufficient stock',
      );
    }

    newStock -= dto.quantity;
  }

  const updatedProduct =
    await this.prisma.product.update({
      where: {
        id:productId,
      },
      data: {
        stock: newStock,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  return {
    message: 'Stock updated successfully',
    previousStock: product.stock,
    currentStock: updatedProduct.stock,
    operation: dto.operation,
    quantity: dto.quantity,
    product: updatedProduct,
  };
}

  async findOne(id: string) {
    const product =
      await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: { id },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    const {
      categoryId,
      ...productData
    } = updateProductDto as any;

    if (categoryId) {
      const category =
        await this.prisma.category.findUnique({
          where: {
            id: categoryId,
          },
        });

      if (!category) {
        throw new NotFoundException(
          'Category not found',
        );
      }
    }

    const updatedProduct =
      await this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          ...(categoryId
            ? {
              category: {
                connect: {
                  id: categoryId,
                },
              },
            }
            : {}),
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

    return {
      message: 'Product updated successfully',
      product: updatedProduct,
    };
  }

  async remove(id: string) {
    const product =
      await this.prisma.product.findUnique({
        where: { id },
      });

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });

    return {
      message: 'Product deleted successfully',
    };
  }
}