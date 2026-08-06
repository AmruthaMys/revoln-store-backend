import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SearchProductsDto } from './dto/search-products.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LowStockDto } from './dto/low-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(
      createProductDto,
    );
  }

  @Get()
  findAll(@Query() dto: SearchProductsDto) {
    return this.productsService.findAll(dto);
  }

  @Get('featured')
  getFeaturedProducts() {
    return this.productsService.getFeaturedProducts();
  }

  @Get('new-arrivals')
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @Get('best-sellers')
  getBestSellers() {
    return this.productsService.getBestSellers();
  }

  @Get(':id/related')
  getRelatedProducts(@Param('id') id: string) {
    return this.productsService.getRelatedProducts(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/low-stock')
  getLowStockProducts(
    @Query() dto: LowStockDto,
  ) {
    return this.productsService.getLowStockProducts(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/:id/inventory-history')
  getInventoryHistory(@Param('id') id: string) {
    return this.productsService.getInventoryHistory(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/stock')
  updateStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateStock(
      id,
      req.user.userId,
      dto,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(
      id,
      updateProductDto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}