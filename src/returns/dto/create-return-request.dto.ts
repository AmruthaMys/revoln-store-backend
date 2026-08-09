import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReturnRequestDto {
  @ApiProperty({
    example: 'ckc1s9k8j0002exm1x1cw9g99',
    description: 'ID of the order being returned',
  })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiPropertyOptional({
    example: 'Item arrived damaged',
    description: 'Optional return reason',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
