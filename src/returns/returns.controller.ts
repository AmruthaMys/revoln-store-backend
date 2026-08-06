import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';    
import { RoleType } from '@prisma/client';

@ApiTags('Returns')
@ApiBearerAuth()
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateReturnRequestDto) {
    return this.returnsService.createReturnRequest(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findMyReturns(@Req() req: any) {
    return this.returnsService.findMyReturns(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Get('admin')
  findAll() {
    return this.returnsService.findAllReturnRequests();
  }


  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.returnsService.findReturnRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.returnsService.cancelReturnRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.returnsService.approveReturnRequest(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.returnsService.rejectReturnRequest(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/received')
  receive(@Param('id') id: string) {
    return this.returnsService.markReturnReceived(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':id/refund')
  refund(@Param('id') id: string) {
    return this.returnsService.refundReturnRequest(id);
  }
}
