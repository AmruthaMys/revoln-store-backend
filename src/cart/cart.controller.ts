import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApplyCouponDto } from './dto/apply-coupon.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(
        private readonly cartService: CartService,
    ) { }

    @Post()
    addToCart(
        @Req() req: any,
        @Body() addToCartDto: AddToCartDto,
    ) {
        return this.cartService.addToCart(
            req.user.userId,
            addToCartDto,
        );
    }
    @Post('apply-coupon')
    applyCoupon(
        @Req() req: any,
        @Body() dto: ApplyCouponDto,
    ) {
        return this.cartService.applyCoupon(req.user.userId, dto);
    }
    @Get()
    getMyCart(@Req() req: any) {
        return this.cartService.getMyCart(req.user.userId);
    }

    @Patch(':id')
    updateCartItem(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updateCartDto: UpdateCartDto,
    ) {
        return this.cartService.updateCartItem(
            req.user.userId,
            id,
            updateCartDto,
        );
    }

    @Delete(':id')
    removeCartItem(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.cartService.removeCartItem(
            req.user.userId,
            id,
        );
    }

    @Delete()
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.userId);
    }
}