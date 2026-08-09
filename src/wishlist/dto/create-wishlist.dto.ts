import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'ID of the product to add to the wishlist',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;
}