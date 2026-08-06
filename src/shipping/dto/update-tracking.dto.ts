import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @IsString()
  @IsNotEmpty()
  trackingNumber!: string;

  @IsString()
  @IsNotEmpty()
  carrier!: string;
}
