import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiPropertyOptional({
    example: 'Changed mind after purchase',
    description: 'Optional cancellation reason',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
} 