import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({
    example: 'Jane Doe',
    description: 'Full name for the address entry',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Contact phone number',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Primary street address',
  })
  @IsString()
  @IsNotEmpty()
  addressLine1: string;

  @ApiPropertyOptional({
    example: 'Apt 4B',
    description: 'Additional address line',
  })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City for the address',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'NY',
    description: 'State or region',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country name',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal or ZIP code',
  })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({
    example: 'Near the park',
    description: 'Optional landmark or directions',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this address is the default address',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}