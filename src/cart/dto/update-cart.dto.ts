import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartDto {
  @ApiProperty({
    example: 3,
    description: 'New quantity for the cart item',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}
