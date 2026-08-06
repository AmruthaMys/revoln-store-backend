import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto) {

    // Step 1: Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: createUserDto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (createUserDto.phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: {
          phone: createUserDto.phone,
        },
      });

      if (existingPhone) {
        throw new ConflictException('Phone already exists');
      }
    }
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : null;
    // Step 2: Create user
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = user;

    return result;


  }

  async findAll() {
    return this.prisma.user.findMany({
      include: {
        role: true,
        addresses: true,
      },
    });
  }
  async findProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
        addresses: true,
      },
    });
    console.log("user", user);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, ...result } = user;

    return result;
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      updateProfileDto.phone &&
      updateProfileDto.phone !== user.phone
    ) {
      const phoneExists = await this.prisma.user.findUnique({
        where: {
          phone: updateProfileDto.phone,
        },
      });

      if (phoneExists) {
        throw new ConflictException(
          'Phone number already exists',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateProfileDto,
      include: {
        role: true,
        addresses: true,
      },
    });

    const {
      password,
      refreshToken,
      resetPasswordToken,
      verificationToken,
      ...result
    } = updatedUser;

    return {
      message: 'Profile updated successfully',
      user: result,
    };
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        addresses: true,
      },
    });
  }



  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}