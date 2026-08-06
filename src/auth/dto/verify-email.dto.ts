import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'verify-token-123',
    description: 'Email verification token',
  })
  @IsNotEmpty()
  token!: string;
}
