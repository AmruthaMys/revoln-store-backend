import { IsString } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}