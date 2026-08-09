import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @ApiProperty({
    example: 'TRACK123456',
    description: 'Tracking number for the shipment',
  })
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @ApiProperty({
    example: 'DHL',
    description: 'Carrier handling the shipment',
  })
  @IsString()
  @IsNotEmpty()
  carrier!: string;
}
