import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'Leather Belt',
    description: 'Name of the product',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'High-quality leather belt for men',
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'SKU12345',
    description: 'Unique SKU for the product',
  })
  @IsString()
  sku: string;

  @ApiProperty({
    example: 999,
    description: 'Product price',
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Available stock quantity',
  })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Optional product image URL',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active and visible',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'Category ID for the product',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
