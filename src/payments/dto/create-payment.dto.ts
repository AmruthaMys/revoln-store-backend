import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'Order ID for which payment is being created',
  })
  @IsString()
  orderId: string;
} 