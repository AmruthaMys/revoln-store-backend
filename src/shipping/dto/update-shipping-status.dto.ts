import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateShippingStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.SHIPPED,
    description: 'Updated shipping status',
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status!: OrderStatus;
}
