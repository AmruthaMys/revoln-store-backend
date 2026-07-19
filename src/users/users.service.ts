import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  create(createUserDto: CreateUserDto) {
    // Business logic will be implemented later
    return { message: 'User created', data: createUserDto };
  }

  findAll() {
    // Business logic will be implemented later
    return { message: 'All users' };
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return { message: `User #${id} updated`, data: updateUserDto };
  }

  remove(id: string) {
    return { message: `User #${id} removed` };
  }
}