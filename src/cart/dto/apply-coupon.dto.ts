import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ApplyCouponDto {
  @ApiProperty({
    example: 'SUMMER10',
    description: 'Coupon code to apply to the cart',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}