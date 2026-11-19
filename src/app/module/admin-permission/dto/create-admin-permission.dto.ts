import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAdminPermissionDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['orders.read', 'orders.update'],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @Matches(/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)+$/, { each: true })
  permissions!: string[];
}
