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

import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
  ) {}

  // Add Address

  @Post()
  create(
    @Req() req,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.create(
      req.user.userId,
      createAddressDto,
    );
  }

  // Get My Addresses

  @Get()
  findAll(@Req() req) {
    return this.addressService.findAll(
      req.user.userId,
    );
  }

  // Get Address By Id

  @Get(':id')
  findOne(
    @Req() req,
    @Param('id') id: string,
  ) {
    return this.addressService.findOne(
      req.user.userId,
      id,
    );
  }

  // Update Address

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.update(
      req.user.userId,
      id,
      updateAddressDto,
    );
  }

  // Delete Address

  @Delete(':id')
  remove(
    @Req() req,
    @Param('id') id: string,
  ) {
    return this.addressService.remove(
      req.user.userId,
      id,
    );
  }

  // Set Default Address

  @Patch(':id/default')
  setDefault(
    @Req() req,
    @Param('id') id: string,
  ) {
    return this.addressService.setDefault(
      req.user.userId,
      id,
    );
  }
}