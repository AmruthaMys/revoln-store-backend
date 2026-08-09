import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'refresh-token-123',
    description: 'JWT refresh token used to request a new access token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}