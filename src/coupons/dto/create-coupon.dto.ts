import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({
    example: 'SUMMER10',
    description: 'Unique coupon code',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    example: '10% off summer sale',
    description: 'Coupon description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
    description: 'Discount type for the coupon',
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    example: 10,
    description: 'Discount amount or percentage',
  })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Minimum order value required for coupon',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrder?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Maximum discount amount allowed',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maximumDiscount?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Maximum usage limit for the coupon',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({
    example: '2026-08-01T00:00:00Z',
    description: 'Coupon start date in ISO format',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-08-31T23:59:59Z',
    description: 'Coupon end date in ISO format',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the coupon is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'Address ID associated with the coupon',
  })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiPropertyOptional({
    example: 'SUMMER10',
    description: 'Optional coupon code category',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}
