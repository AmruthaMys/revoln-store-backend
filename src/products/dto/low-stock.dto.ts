import {
  IsNumberString,
  IsOptional,
} from 'class-validator';

export class LowStockDto {
  @IsOptional()
  @IsNumberString()
  threshold?: string = '10';

  @IsOptional()
  @IsNumberString()
  page?: string = '1';

  @IsOptional()
  @IsNumberString()
  limit?: string = '10';
}