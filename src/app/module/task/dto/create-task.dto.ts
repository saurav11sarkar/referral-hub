import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Product video review' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'Watch the product video and write a review.' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'Submit your review with a screenshot.' })
  @IsString()
  instructions!: string;

  @ApiProperty({ example: 20 })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
  )
  @IsNumber()
  @Min(0)
  reward!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-30T23:59:59+06:00',
  })
  @IsDateString({ strict: true })
  deadlineAt!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsString()
  image?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsString()
  @IsUrl()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsString()
  @IsUrl()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ example: 'active', default: 'active' })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsString()
  status?: string;
}
