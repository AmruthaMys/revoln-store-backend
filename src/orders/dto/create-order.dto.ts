import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'Shipping address ID for the order',
  })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiPropertyOptional({
    example: 'SUMMER10',
    description: 'Optional coupon code to apply',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;
}