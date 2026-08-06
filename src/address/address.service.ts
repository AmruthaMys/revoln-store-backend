import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // ===========================
  // Add Address
  // ===========================

  async create(
    userId: string,
    createAddressDto: CreateAddressDto,
  ) {
    // Check whether user already has addresses
    const existingAddresses = await this.prisma.address.count({
      where: {
        userId,
      },
    });

    let isDefault = createAddressDto.isDefault ?? false;

    // First address should always be default
    if (existingAddresses === 0) {
      isDefault = true;
    }

    // If user explicitly selected default,
    // remove default from all other addresses
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        ...createAddressDto,
        userId,
        isDefault,
      },
    });

    return {
      message: 'Address added successfully',
      address,
    };
  }

  // ===========================
  // Get My Addresses
  // ===========================

  async findAll(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return addresses;
  }

  // ===========================
  // Get Address By ID
  // ===========================

  async findOne(
    userId: string,
    id: string,
  ) {
    const address = await this.prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }
console.log('Address UserId :', address?.userId);
console.log('Logged UserId  :', userId);
console.log(address?.userId === userId);
    if (address.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to access this address',
      );
    }

    return address;
  }

  // ===========================
  // Update Address
  // ===========================

  async update(
    userId: string,
    id: string,
    updateAddressDto: UpdateAddressDto,
  ) {
    const address = await this.prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this address',
      );
    }

    if (updateAddressDto.isDefault) {
      await this.prisma.address.updateMany({
        where: {
          userId,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedAddress = await this.prisma.address.update({
      where: {
        id,
      },
      data: updateAddressDto,
    });

    return {
      message: 'Address updated successfully',
      address: updatedAddress,
    };
  }
  // ===========================
  // Delete Address
  // ===========================

  async remove(
    userId: string,
    id: string,
  ) {
    const address = await this.prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this address',
      );
    }

    await this.prisma.address.delete({
      where: {
        id,
      },
    });

    // If the deleted address was the default,
    // make the newest remaining address the default.
    if (address.isDefault) {
      const latestAddress = await this.prisma.address.findFirst({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (latestAddress) {
        await this.prisma.address.update({
          where: {
            id: latestAddress.id,
          },
          data: {
            isDefault: true,
          },
        });
      }
    }

    return {
      message: 'Address deleted successfully',
    };
  }

  // ===========================
  // Set Default Address
  // ===========================

  async setDefault(
    userId: string,
    id: string,
  ) {
    const address = await this.prisma.address.findUnique({
      where: {
        id,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Address not found',
      );
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this address',
      );
    }

    await this.prisma.address.updateMany({
      where: {
        userId,
      },
      data: {
        isDefault: false,
      },
    });

    const updatedAddress = await this.prisma.address.update({
      where: {
        id,
      },
      data: {
        isDefault: true,
      },
    });

    return {
      message: 'Default address updated successfully',
      address: updatedAddress,
    };
  }
}