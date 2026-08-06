import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-order')
  createOrder(
    @Req() req: any,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createOrder(
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verifyPayment(
    @Req() req: any,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.paymentsService.verifyPayment(
      req.user.userId,
      dto,
    );
  }
}