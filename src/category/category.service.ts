import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory =
      await this.prisma.category.findUnique({
        where: {
          name: createCategoryDto.name,
        },
      });

    if (existingCategory) {
      throw new ConflictException(
        'Category already exists',
      );
    }

    const category =
      await this.prisma.category.create({
        data: createCategoryDto,
      });

    return {
      message: 'Category created successfully',
      category,
    };
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        products: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const category =
      await this.prisma.category.findUnique({
        where: {
          id,
        },
        include: {
          products: true,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ) {
    const category =
      await this.prisma.category.findUnique({
        where: {
          id,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    if (
      updateCategoryDto.name &&
      updateCategoryDto.name !== category.name
    ) {
      const existing =
        await this.prisma.category.findUnique({
          where: {
            name: updateCategoryDto.name,
          },
        });

      if (existing) {
        throw new ConflictException(
          'Category already exists',
        );
      }
    }

    const updatedCategory =
      await this.prisma.category.update({
        where: {
          id,
        },
        data: updateCategoryDto,
      });

    return {
      message: 'Category updated successfully',
      category: updatedCategory,
    };
  }

  async remove(id: string) {
    const category =
      await this.prisma.category.findUnique({
        where: {
          id,
        },
        include: {
          products: true,
        },
      });

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    if (category.products.length > 0) {
      throw new ConflictException(
        'Cannot delete category because products exist.'
      );
    }

    await this.prisma.category.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Category deleted successfully',
    };
  }
}