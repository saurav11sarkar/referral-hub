import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateVideoDto {
  @ApiProperty({ example: 'কীভাবে কাজ জমা দেবেন' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'কাজ জমা দেওয়ার নিয়ম দেখুন।' })
  @IsString()
  description!: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' })
  @IsUrl()
  videoUrl!: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'active', default: 'active' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  status?: string;
}
