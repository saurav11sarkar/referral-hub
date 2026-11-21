import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Baby feeding bottle' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'A 250 ml feeding bottle' })
  @IsString()
  discription!: string;

  @ApiProperty({ example: 'Baby Products' })
  @IsString()
  @IsNotEmpty()
  catagory!: string;

  @ApiProperty({ example: 320 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  image?: string[];

  @ApiPropertyOptional({ example: 'active', default: 'active' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;
}
