import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtStrategy } from '../auth/jwt.strategy';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [PassportModule],
  providers: [UsersService, JwtAuthGuard, JwtStrategy],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
