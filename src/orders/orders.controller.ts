import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RoleType } from '@prisma/client';
import { CancelOrderDto } from './dto/cancel-order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    findMyOrders(@Req() req: any) {
        return this.ordersService.findMyOrders(req.user.userId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    @Get('admin')
    getAllOrders(@Query() dto: GetOrdersDto) {
        return this.ordersService.getAllOrders(dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    @Get('admin/:id')
    getOrderById(@Param('id') id: string) {
        return this.ordersService.getOrderById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.userId, id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(id, dto);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    @Patch(':id/payment')
    updatePaymentStatus(
        @Param('id') id: string,
        @Body() dto: UpdatePaymentStatusDto,
    ) {
        return this.ordersService.updatePaymentStatus(id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(
        @Req() req: any,
        @Body() createOrderDto: CreateOrderDto,
    ) {
        return this.ordersService.create(
            req.user.userId,
            createOrderDto,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/cancel')
    cancelOrder(
        @Req() req: any,
        @Param('id') id: string,
        @Body() dto: CancelOrderDto,
    ) {
        return this.ordersService.cancelOrder(
            req.user.userId,
            id,
            dto,
        );
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.ADMIN)
    @Patch('admin/:id/cancel')
    adminCancelOrder(
        @Param('id') id: string,
        @Body() dto: CancelOrderDto,
    ) {
        return this.ordersService.cancelOrderByAdmin(id, dto);
    }
}
