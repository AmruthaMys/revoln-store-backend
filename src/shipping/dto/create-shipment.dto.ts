import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({
    example: 'DHL',
    description: 'Shipping carrier name',
  })
  @IsString()
  @IsNotEmpty()
  carrier!: string;

  @ApiProperty({
    example: 'TRACK123456',
    description: 'Shipment tracking number',
  })
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @ApiProperty({
    example: '2026-08-12T00:00:00Z',
    description: 'Estimated delivery date in ISO format',
  })
  @IsDateString()
  @IsNotEmpty()
  estimatedDelivery!: string;
}
