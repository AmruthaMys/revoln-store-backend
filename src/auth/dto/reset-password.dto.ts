import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'reset-token-123',
    description: 'Password reset token received by email',
  })
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'New password to set',
  })
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
