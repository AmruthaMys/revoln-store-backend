import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShippingStatusDto } from './dto/update-shipping-status.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleType } from '@prisma/client';

@ApiTags('Shipping')
@ApiBearerAuth()
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Post(':orderId')
  createShipment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.shippingService.createShipment(orderId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':orderId/status')
  updateShippingStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateShippingStatusDto,
  ) {
    return this.shippingService.updateShippingStatus(orderId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':orderId/delivered')
  markDelivered(@Param('orderId') orderId: string) {
    return this.shippingService.markDelivered(orderId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':orderId/tracking')
  updateTracking(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateTrackingDto,
  ) {
    return this.shippingService.updateTracking(orderId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Get(':orderId')
  getShipment(@Param('orderId') orderId: string) {
    return this.shippingService.getShipment(orderId);
  }

  @Get('track/:trackingNumber')
  trackShipment(@Param('trackingNumber') trackingNumber: string) {
    return this.shippingService.trackShipment(trackingNumber);
  }
}
