import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';

@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  addToWishlist(
    @Req() req: any,
    @Body() dto: CreateWishlistDto,
  ) {
    return this.wishlistService.addToWishlist(
      req.user.userId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyWishlist(@Req() req: any) {
    return this.wishlistService.getMyWishlist(
      req.user.userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':productId')
  removeFromWishlist(
    @Req() req: any,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.removeFromWishlist(
      req.user.userId,
      productId,
    );
  }
}