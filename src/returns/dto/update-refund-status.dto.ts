import { IsEnum } from 'class-validator';
import { RefundStatus } from '@prisma/client';

export class UpdateRefundStatusDto {
  @IsEnum(RefundStatus)
  refundStatus!: RefundStatus;
}
