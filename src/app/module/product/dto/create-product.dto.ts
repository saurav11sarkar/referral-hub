import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
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
  orginalPrice!: number;

  @ApiProperty({ example: 320 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsNumber()
  @Min(0)
  discountPrice!: number;

  @ApiPropertyOptional({ example: 50, default: 0 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  rewardTokens?: number;

  @ApiPropertyOptional({ example: 200, nullable: true, type: Number })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  tokenPrice?: number | null;

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
