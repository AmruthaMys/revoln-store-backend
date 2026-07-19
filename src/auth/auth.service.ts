import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  register(registerDto: RegisterDto) {
    // Business logic will be implemented later
    return { message: 'User registered successfully', data: registerDto };
  }

  login(loginDto: LoginDto) {
    // Business logic will be implemented later
    return { message: 'User logged in successfully', data: loginDto };
  }
}