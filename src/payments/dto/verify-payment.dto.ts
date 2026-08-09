import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'Order ID related to the payment',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    example: 'order_9A33XWu170gUtm',
    description: 'Razorpay order ID',
  })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({
    example: 'pay_29QQoUBi66xm2f',
    description: 'Razorpay payment ID',
  })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({
    example: 'signature123',
    description: 'Razorpay signature for verification',
  })
  @IsString()
  razorpaySignature: string;
}