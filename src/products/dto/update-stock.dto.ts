import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum StockOperation {
  INCREASE = 'INCREASE',
  DECREASE = 'DECREASE',
}

export class UpdateStockDto {
  @IsEnum(StockOperation)
  operation: StockOperation;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}