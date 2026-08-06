import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RoleType } from '@prisma/client';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('products/:id/reviews')
  createReview(
    @Req() req: any,
    @Param('id') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(req.user.userId, productId, dto);
  }

  @Get('products/:id/reviews')
  getProductReviews(
    @Param('id') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.reviewsService.getProductReviews(productId, Number(page), Number(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Patch('reviews/:id')
  updateReview(
    @Req() req: any,
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateReview(req.user.userId, reviewId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reviews/:id')
  deleteReview(@Req() req: any, @Param('id') reviewId: string) {
    return this.reviewsService.deleteReview(req.user.userId, reviewId, false);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Get('reviews')
  getAllReviews() {
    return this.reviewsService.getAllReviews();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Delete('admin/reviews/:id')
  deleteAnyReview(@Param('id') reviewId: string) {
    return this.reviewsService.deleteReview('', reviewId, true);
  }
}
