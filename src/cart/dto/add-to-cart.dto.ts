import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'ID of the product to add',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity of the product to add',
  })
  @IsInt()
  @Min(1)
  quantity: number;
}