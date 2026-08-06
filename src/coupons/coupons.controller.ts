import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    Param,
    Patch,
    Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleType } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { GetCouponsDto } from './dto/get-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    @Roles(RoleType.ADMIN)
    @Post()
    createCoupon(@Body() dto: CreateCouponDto) {
        return this.couponsService.createCoupon(dto);
    }

    @Roles(RoleType.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get()
    getAllCoupons(@Query() dto: GetCouponsDto) {
        return this.couponsService.getAllCoupons(dto);
    }

    @Get('code/:code')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    getCouponByCode(
        @Param('code') code: string,
    ) {
        return this.couponsService.getCouponByCode(code);
    }

    @Roles(RoleType.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get(':id')
    getCouponById(@Param('id') id: string) {
        return this.couponsService.getCouponById(id);
    }

    @Roles(RoleType.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Patch(':id')
    updateCoupon(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
        return this.couponsService.updateCoupon(id, dto);
    }

    @Roles(RoleType.ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete(':id')
    deleteCoupon(@Param('id') id: string) {
        return this.couponsService.deleteCoupon(id);
    }
}
