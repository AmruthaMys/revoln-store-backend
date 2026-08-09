import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StockOperation {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export class UpdateStockDto {
  @ApiProperty({
    enum: StockOperation,
    example: StockOperation.INCREASE,
    description: 'Stock adjustment operation',
  })
  @IsEnum(StockOperation)
  operation: StockOperation;

  @ApiProperty({
    example: 5,
    description: 'Quantity to increase or decrease',
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 'Restocking damaged units',
    description: 'Optional note about the stock operation',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}