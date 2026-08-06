import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReturnRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
