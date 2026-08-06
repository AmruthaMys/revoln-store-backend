import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentPassword@123',
    description: 'Current password for user account',
  })
  @IsNotEmpty()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({
    example: 'NewPassword@123',
    description: 'Desired new password',
  })
  @IsNotEmpty()
  @MinLength(6)
  newPassword!: string;
}
